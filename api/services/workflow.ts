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
        
        const meegleItem = await meegleService.createWorkItem(
            projectKey, 
            event.type.toUpperCase(), // Work Item Type Key
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
