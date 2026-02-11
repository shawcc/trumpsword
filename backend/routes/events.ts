import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { collectorService } from '../services/collector.js';
import { workflowService } from '../services/workflow.js';

const router = Router();

// POST /api/events/retry (Retry Pending Syncs)
router.post('/retry', async (req, res) => {
    try {
        console.log('[API] Manual retry for pending events triggered');
        
        // Fetch all events that failed sync or are pending (excluding success)
        const { data: pendingEvents, error } = await supabase
            .from('events')
            .select('*')
            .neq('meegle_sync_status', 'success')
            .order('event_date', { ascending: false })
            .limit(50); // Limit to avoid timeout

        if (error) throw error;

        if (!pendingEvents || pendingEvents.length === 0) {
            return res.json({ message: 'No pending events to retry', count: 0 });
        }

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (const event of pendingEvents) {
            try {
                console.log(`Retrying sync for event ${event.id}...`);
                await workflowService.startProcess(event);
                successCount++;
            } catch (e: any) {
                console.error(`Retry failed for event ${event.id}:`, e);
                failCount++;
                errors.push(`${event.title}: ${e.message}`);
            }
        }

        res.json({
            success: true,
            message: `Retry completed. Success: ${successCount}, Failed: ${failCount}`,
            stats: { successCount, failCount, errors }
        });

    } catch (error: any) {
        console.error('[API] Retry failed:', error);
        res.status(500).json({ error: error.message || 'Retry failed' });
    }
});

// POST /api/events/trigger (Manual Trigger)
router.post('/trigger', async (req, res) => {
    try {
        console.log('[API] Manual event collection triggered');
        const results = await collectorService.collectAll();
        res.json({ 
            success: true, 
            message: 'Collection triggered successfully',
            stats: {
                total_processed: results.added,
                errors: results.errors
            }
        });
    } catch (error: any) {
        console.error('[API] Trigger failed:', error);
        res.status(500).json({ error: error.message || 'Collection failed' });
    }
});

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
