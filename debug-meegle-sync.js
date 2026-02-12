import dotenv from 'dotenv';
// Mock DB before import
process.env.DEBUG_MODE = 'true';

import { meegleService } from './backend/services/meegle.js';
import { workflowService } from './backend/services/workflow.js';
import { supabase } from './backend/lib/supabase.js';

dotenv.config();

// Mock Supabase calls in workflowService
// We need to override the supabase.from... chain
const mockSupabase = {
    from: (table) => ({
        select: () => ({
            eq: () => ({
                single: async () => {
                    if (table === 'workflow_templates') {
                        return { 
                            data: { 
                                id: 'mock-template-id', 
                                node_structure: { nodes: ['Monitor'] } 
                            } 
                        };
                    }
                    return { data: null };
                }
            })
        }),
        insert: async (data) => {
            console.log(`[MockDB] Insert into ${table}:`, data);
            return { data: { id: 'mock-id-' + Date.now(), ...data }, error: null };
        },
        update: async (data) => {
            console.log(`[MockDB] Update ${table}:`, data);
            return { data, error: null };
        }
    })
};

// Hack: Monkey patch the imported supabase client if possible, 
// OR just rely on the fact that we are testing Meegle service directly or handling errors.
// Since `workflowService` imports `supabase` directly, we can't easily mock it without dependency injection.
// BUT, we can test `meegleService` directly first, which is the core issue.

async function debugSync() {
    console.log('--- Starting Meegle Sync Debug ---');
    console.log('Project Key:', process.env.MEEGLE_PROJECT_KEY);
    console.log('Plugin ID:', process.env.MEEGLE_PLUGIN_ID ? 'Set' : 'Missing');

    // 1. Test fetching types
    console.log('\n1. Testing Type Fetching...');
    try {
        const types = await meegleService.getWorkItemTypes(process.env.MEEGLE_PROJECT_KEY || 'POLITICS_DEMO');
        console.log('Fetched Types:', JSON.stringify(types, null, 2));
    } catch (e) {
        console.error('Failed to fetch types:', e);
    }

    // 2. Test fetching fields for 'Social Media' (assuming it exists or mocking it)
    console.log('\n2. Testing Field Fetching for SOCIAL...');
    // Note: We need a valid type key from step 1, but for debug we try to guess or use the mapped one if configured
    // Let's assume user followed instructions and named it 'Social Media'
    
    // 3. Mock a Sync Event
    console.log('\n3. Mocking Workflow Sync...');
    const mockEvent = {
        id: 'debug-event-' + Date.now(),
        type: 'social_post',
        title: 'DEBUG: Test Post from Script',
        event_date: new Date().toISOString(),
        raw_data: {
            url: 'https://debug.com',
            summary: 'This is a debug summary from the script.'
        }
    };

    try {
        await workflowService.startProcess(mockEvent);
        console.log('Workflow sync triggered.');
    } catch (e) {
        console.error('Workflow sync failed:', e);
    }
}

debugSync();
