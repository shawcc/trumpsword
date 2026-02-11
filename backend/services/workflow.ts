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
        
        // Validation: If Project Key is still default or missing, we can't sync.
        if (!projectKey || projectKey === 'POLITICS_DEMO') {
            console.error('[Workflow] CRITICAL: MEEGLE_PROJECT_KEY is missing or default. Cannot sync to Meegle.');
            // We return early but don't throw, so the local process is still created.
            return process;
        }
        
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
        
        // Strict Mapping based on user's New Design
        const typeMappingRules = [
            { internal: 'legislative', targetName: 'Bill' },
            { internal: 'executive', targetName: 'Executive Orders' },
            { internal: 'appointment', targetName: 'Oops' }
        ];

        let match: any = null;
        
        const rule = typeMappingRules.find(r => r.internal === event.type);
        if (rule) {
            // Try to find by Exact Name first, then Partial Name
            match = availableTypes.find((t: any) => t.name === rule.targetName);
            if (!match) {
                 match = availableTypes.find((t: any) => t.name.includes(rule.targetName));
            }
        }

        if (match) {
            console.log(`[Workflow] Mapped internal type '${event.type}' to Meegle type '${match.name}' (${match.type_key})`);
            targetTypeKey = match.type_key;
        } else {
            console.warn(`[Workflow] CRITICAL: Could not find Meegle Type '${rule?.targetName}' for event '${event.type}'. Please ensure Meegle project is configured correctly.`);
            // If strictly enforcing new design, we might want to return here or use a fallback.
            // For now, we proceed but log a warning, it might fail if targetTypeKey is invalid.
        }
        
        // 3. Dynamic Field Mapping
        // We fetch the actual field definitions from Meegle for the target type
        const typeFields = await meegleService.getWorkItemTypeFields(projectKey, targetTypeKey);
        
        // Prepare standard payload
        let payload: any = {};

        // Helper to find field key by name (case insensitive partial match)
        const findFieldKey = (name: string) => {
            const f = typeFields.find((tf: any) => tf.name.toLowerCase().includes(name.toLowerCase()));
            return f ? f.field_key : null;
        };

        // --- Standardized Field Mapping for New Design ---
        
        // 1. "Trump said that" -> Title / Event Content
        const trumpSaidKey = findFieldKey('Trump said that');
        if (trumpSaidKey) payload[trumpSaidKey] = event.title; 
        
        // 2. "We need to" -> Action Title (e.g. "Process Bill HR.123")
        const weNeedToKey = findFieldKey('We need to');
        if (weNeedToKey) payload[weNeedToKey] = `Process ${event.type}: ${event.title}`;

        // 3. "Which means" -> AI Analysis / Summary
        const whichMeansKey = findFieldKey('Which means');
        if (whichMeansKey) payload[whichMeansKey] = event.raw_data.summary || 'AI Analysis Pending...';

        // 4. "It should started at" -> Date
        const startDateKey = findFieldKey('It should started at');
        if (startDateKey) payload[startDateKey] = new Date(event.event_date).getTime();
        
        // 5. "Tag" -> Multi Select (Default value)
        const tagKey = findFieldKey('Tag');
        if (tagKey) payload[tagKey] = ['Make America Great Again']; 

        // 6. Source Link (if field exists)
        const linkKey = findFieldKey('Source Link') || findFieldKey('link');
        if (linkKey) payload[linkKey] = event.raw_data.url || '';

        // 7. Title (System Field) - Always set title if possible
        payload['title'] = event.title;

        const meegleItem = await meegleService.createWorkItem(
            projectKey, 
            targetTypeKey, 
            payload
        );
        console.log('Synced to Meegle:', meegleItem);
        
        // Update Event Sync Status: Success
        await supabase.from('events').update({
            meegle_sync_status: 'success',
            meegle_sync_error: null
        }).eq('id', event.id);

    } catch (e: any) {
        console.error('Failed to sync to Meegle:', e);
        
        // Update Event Sync Status: Failed
        await supabase.from('events').update({
            meegle_sync_status: 'failed',
            meegle_sync_error: e.message
        }).eq('id', event.id);

        // CRITICAL FIX: Rethrow error so the caller knows sync failed!
        // Previously this was swallowed, leading to "Fake Success" reports.
        throw new Error(`Meegle Sync Failed: ${e.message}`);
    }
    
    return process;
  }
};
