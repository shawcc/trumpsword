import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetData() {
    console.log('Resetting events data...');
    // Delete all rows
    const { error } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    if (error) {
        console.error('Error deleting events:', error);
    } else {
        console.log('Events table cleared.');
    }
}

resetData();
