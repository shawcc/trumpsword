import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { meegleService } from '../services/meegle.js';

const router = Router();

// GET /api/processes
router.get('/', async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  let query = supabase
    .from('processes')
    .select('*, events(title, type), workflow_templates(name)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count });
});

// PUT /api/processes/:id/status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { nextNode, transitionData } = req.body;

  if (!nextNode) {
      return res.status(400).json({ error: 'nextNode is required' });
  }

  try {
    // 1. Get current process
    const { data: process } = await supabase.from('processes').select('*').eq('id', id).single();
    if (!process) return res.status(404).json({ error: 'Process not found' });

    // 2. Update process
    const { error: updateError } = await supabase
      .from('processes')
      .update({ current_node: nextNode, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) throw updateError;

    // 3. Add history
    await supabase.from('status_history').insert({
      process_id: id,
      from_node: process.current_node,
      to_node: nextNode,
      transition_data: transitionData || {}
    });

    // 4. Sync to Meegle (Transition)
    // For now we just log it as we don't have real transition IDs mapping
    console.log(`[Meegle Sync] Transitioning process ${id} to ${nextNode}`);
    // await meegleService.transitionState(...)

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
