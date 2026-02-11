import { congressService } from './congress.js';
import { whiteHouseService } from './whitehouse.js';
import { llmService } from './llm.js';
import { supabase } from '../lib/supabase.js';
import { workflowService } from './workflow.js';

export const collectorService = {
  async collectAll() {
    console.log('Starting collection job...');
    const results = {
      added: 0,
      errors: [] as string[]
    };

    // 1. Congress
    try {
      const billsData = await congressService.fetchRecentBills();
      if (billsData && billsData.bills) {
        for (const bill of billsData.bills) {
            try {
                await this.processEvent(bill, 'congress');
                results.added++;
            } catch (innerError: any) {
                console.error('Error processing bill:', innerError);
            }
        }
      }
    } catch (e: any) {
      console.error('Congress Collection Error:', e);
      results.errors.push(`Congress Error: ${e.message}`);
    }

    // 2. WhiteHouse
    try {
      const orders = await whiteHouseService.fetchExecutiveOrders();
      if (orders) {
        for (const order of orders) {
             try {
                await this.processEvent(order, 'whitehouse');
                results.added++;
            } catch (innerError: any) {
                console.error('Error processing order:', innerError);
            }
        }
      }
    } catch (e: any) {
      console.error('WhiteHouse Collection Error:', e);
      results.errors.push(`WhiteHouse Error: ${e.message}`);
    }
    
    console.log('Collection job finished.', results);
    return results;
  },

  async processEvent(rawData: any, source: string) {
    // 1. Check deduplication
    // Use URL or Number as external ID
    const externalId = rawData.number ? `bill-${rawData.number}` : (rawData.url || rawData.id); 
    
    if (!externalId) {
        console.warn('Skipping event with no ID:', rawData);
        return;
    }

    const { data: existing } = await supabase
      .from('events')
      .select('id, type, title, event_date, raw_data') // Need more fields to retry sync
      .eq('external_id', String(externalId))
      .single();

    if (existing) {
        // Logic Fix: Even if event exists locally, check if it needs Meegle sync.
        // We try to trigger workflow again. Workflow service handles deduplication of *processes* if needed,
        // or just idempotently updates.
        console.log(`Event ${externalId} exists. Retrying workflow/sync...`);
        try {
            await workflowService.startProcess(existing);
        } catch (e: any) {
            console.error(`Retry sync failed for ${externalId}:`, e);
            throw e; // Propagate error to caller
        }
        return; 
    }

    // 2. Analyze
    const analysis = await llmService.analyzeEvent(rawData);

    // 3. Store
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        external_id: String(externalId),
        title: rawData.title || 'Untitled Event',
        type: analysis.type,
        raw_data: rawData,
        source: source,
        confidence_score: analysis.confidence,
        event_date: rawData.updateDate || rawData.date || new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
    }
    
    console.log(`Stored new event: ${event.title} (${event.type})`);
    
    // 4. Trigger Workflow
    await workflowService.startProcess(event);
  }
};
