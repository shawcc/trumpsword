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
        // Format: MEEGLE_TYPE_MAP='{"legislative": "story_123", "executive": "task_456"}'
        const manualMapStr = process.env.MEEGLE_TYPE_MAP;
        let manualMap: Record<string, string> = {};
        if (manualMapStr) {
            try {
                manualMap = JSON.parse(manualMapStr);
            } catch (e) {
                console.error('[Workflow] Failed to parse MEEGLE_TYPE_MAP JSON', e);
            }
        }
        
        if (manualMap[event.type]) {
            targetTypeKey = manualMap[event.type];
            console.log(`[Workflow] Used manual mapping for '${event.type}' -> '${targetTypeKey}'`);
        } else {
            // 2. Auto-discovery from Meegle Project
            const availableTypes = await meegleService.getWorkItemTypes(projectKey);
            const match = availableTypes.find((t: any) => 
                t.type_key === targetTypeKey || 
                t.name.toLowerCase().includes(event.type.toLowerCase())
            );

            if (match) {
                console.log(`[Workflow] Mapped internal type '${event.type}' to Meegle type '${match.name}' (${match.type_key})`);
                targetTypeKey = match.type_key;
            } else {
                console.warn(`[Workflow] No matching Meegle type found for '${event.type}'. Using default key '${targetTypeKey}'. Ensure this Type Key exists in project '${projectKey}'.`);
            }
        }
        
        const meegleItem = await meegleService.createWorkItem(
            projectKey, 
            targetTypeKey, 
            {
                title: event.title,
                // summary: event.raw_data.summary || '', // Fields depend on Meegle configuration
                source_link: event.raw_data.url || ''
            }
        );
        console.log('Synced to Meegle:', meegleItem);
    } catch (e) {
        console.error('Failed to sync to Meegle:', e);
        // We don't fail the whole process if Meegle sync fails, we might retry later
    }
    
    return process;
  }
};
