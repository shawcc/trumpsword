import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// GET /api/events
router.get('/', async (req, res) => {
    const { page = 1, limit = 20, type } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    
    let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('event_date', { ascending: false });

    if (type) {
        query = query.eq('type', type);
    }
    
    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data, count });
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Event not found' });
    res.json(data);
});

export default router;
