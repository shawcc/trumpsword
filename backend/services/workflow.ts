import { supabase } from '../lib/supabase.js';
import { meegleService } from './meegle.js';

export const workflowService = {
  // Ensure default templates exist
  async ensureTemplates() {
    const templates = [
      {
        name: 'Legislative Process',
        type: 'legislative',
        node_structure: { nodes: ['Introduction', 'Committee', 'Floor Vote', 'President', 'Law'] },
        transition_rules: {}
      },
      {
        name: 'Executive Order Process',
        type: 'executive',
        node_structure: { nodes: ['Drafting', 'Legal Review', 'Signing', 'Implementation', 'Judicial Review'] },
        transition_rules: {}
      },
      {
        name: 'Appointment Process',
        type: 'appointment',
        node_structure: { nodes: ['Nomination', 'Committee Hearing', 'Committee Vote', 'Senate Floor Vote', 'Confirmed'] },
        transition_rules: {}
      }
    ];

    for (const tmpl of templates) {
      const { data } = await supabase.from('workflow_templates').select('id').eq('type', tmpl.type).single();
      if (!data) {
        await supabase.from('workflow_templates').insert(tmpl);
        console.log(`Created template: ${tmpl.name}`);
      }
    }
  },

  async startProcess(event: any) {
    // 1. Find matching template
    const { data: template } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('type', event.type)
      .single();

    if (!template) {
      console.warn(`No template found for type: ${event.type}`);
      return;
    }

    // 2. Determine initial node
    const initialNode = template.node_structure.nodes[0];

    // 3. Create Process in DB
    const { data: process, error } = await supabase
      .from('processes')
      .insert({
        event_id: event.id,
        template_id: template.id,
        current_node: initialNode,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
        console.error('Failed to create process:', error);
        return;
    }

    // 4. Create Status History
    await supabase.from('status_history').insert({
      process_id: process.id,
      to_node: initialNode,
      transition_data: { reason: 'Initial creation' }
    });

        // 5. Sync to Meegle
    try {
        // Project Key would typically come from configuration
        const projectKey = process.env.MEEGLE_PROJECT_KEY || 'POLITICS_DEMO';
        
        // Dynamic Mapping Logic
        let targetTypeKey = event.type.toUpperCase();
        
        // 1. Check for explicit manual mapping in env vars
        const manualMapStr = process.env.MEEGLE_TYPE_MAP;
        let manualMap: Record<string, string> = {};
        if (manualMapStr) {
            try {
                manualMap = JSON.parse(manualMapStr);
            } catch (e) {
                console.error('[Workflow] Failed to parse MEEGLE_TYPE_MAP JSON', e);
            }
        }
        
        // 2. Auto-discovery and Rule-based Mapping
        const availableTypes = await meegleService.getWorkItemTypes(projectKey);
        
        // Custom Mapping based on screenshots
        // 1. Legislative -> "Bill"
        // 2. Executive -> "Executive Orders" or "PolicyDirectives & Memoranda"
        // 3. Appointment/Issue -> "Oops" (as per user's "Oops" type) or generic "Task"
        
        const typeMappingRules = [
            { internal: 'legislative', targets: ['Bill', 'Legislate', 'Legislative'] },
            { internal: 'executive', targets: ['Executive Orders', 'Executive Order', 'PolicyDirectives', 'Policy'] },
            { internal: 'appointment', targets: ['Oops', 'Appointment', 'Nomination'] } // User seems to use 'Oops' for issues
        ];

        let match: any = null;
        
        // 1. Try manual map first
        if (manualMap[event.type]) {
             match = availableTypes.find((t: any) => t.type_key === manualMap[event.type]);
        }

        // 2. Try rule-based mapping
        if (!match) {
            const rules = typeMappingRules.find(r => r.internal === event.type);
            if (rules) {
                match = availableTypes.find((t: any) => 
                    rules.targets.some(target => t.name.includes(target) || t.type_key.includes(target))
                );
            }
        }

        // 3. Fallback to generic search
        if (!match) {
             match = availableTypes.find((t: any) => 
                t.type_key === targetTypeKey || 
                t.name.toLowerCase().includes(event.type.toLowerCase())
            );
        }

        if (match) {
            console.log(`[Workflow] Mapped internal type '${event.type}' to Meegle type '${match.name}' (${match.type_key})`);
            targetTypeKey = match.type_key;
        } else {
            console.warn(`[Workflow] No matching Meegle type found for '${event.type}'. Using default key '${targetTypeKey}'.`);
        }
        
        // 3. Dynamic Field Mapping
        // We fetch the actual field definitions from Meegle for the target type
        const typeFields = await meegleService.getWorkItemTypeFields(projectKey, targetTypeKey);
        
        // Prepare standard payload
        let payload: any = {
            title: event.title
        };

        // Helper to find field key by name (case insensitive partial match)
        const findFieldKey = (name: string) => {
            const f = typeFields.find((tf: any) => tf.name.toLowerCase().includes(name.toLowerCase()));
            return f ? f.field_key : null;
        };

        // Map "Goals" / "Bill" / "Executive Orders" specific fields
        // "Trump said that" -> Title/Summary
        const trumpSaidKey = findFieldKey('Trump said that');
        if (trumpSaidKey) payload[trumpSaidKey] = event.title; 

        // "We need to" -> Action Item / Title
        const weNeedToKey = findFieldKey('We need to');
        if (weNeedToKey) payload[weNeedToKey] = `Process ${event.type}: ${event.title}`;

        // "Which means" -> Summary / Analysis
        const whichMeansKey = findFieldKey('Which means');
        if (whichMeansKey) payload[whichMeansKey] = event.raw_data.summary || 'AI Analysis Pending...';

        // "It should started at" -> Date
        const startDateKey = findFieldKey('It should started at');
        if (startDateKey) payload[startDateKey] = new Date(event.event_date).getTime();
        
        // "Tag" -> Multi Select
        const tagKey = findFieldKey('Tag');
        if (tagKey) payload[tagKey] = ['Make America Great Again']; 

        // Map "Oops" specific fields if needed
        if (match && match.name === 'Oops') {
             // Description mapping for Oops
             const descKey = findFieldKey('description') || findFieldKey('描述');
             if (descKey) payload[descKey] = event.raw_data.summary;
        }

        // Generic URL mapping
        const linkKey = findFieldKey('link') || findFieldKey('url') || findFieldKey('source');
        if (linkKey) payload[linkKey] = event.raw_data.url || '';

        const meegleItem = await meegleService.createWorkItem(
            projectKey, 
            targetTypeKey, 
            payload
        );
        console.log('Synced to Meegle:', meegleItem);
    } catch (e) {
        console.error('Failed to sync to Meegle:', e);
        // We don't fail the whole process if Meegle sync fails, we might retry later
    }
    
    return process;
  }
};
