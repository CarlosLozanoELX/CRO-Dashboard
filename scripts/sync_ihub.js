/**
 * Spreadsheet to Supabase Sync Script (ESM Version)
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import Papa from 'papaparse';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://byjysjabscpnbxwomhac.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5anlzamFic2NwbmJ4d29taGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwNTQyNSwiZXhwIjoyMDg1MDgxNDI1fQ.39s3tBwcqx9EbWW3HbGICw55Xy02H4A8DJ-WbcKzhXA';

const SHEET_ID = '1GyEh5_D5uM1yETFZByUQmz44uuBYdZrcvilayJJK6OA';
const DATA_SOURCE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sync() {
    console.log('Starting sync from Google Sheets...');

    try {
        // 1. Fetch CSV Data
        const response = await axios.get(DATA_SOURCE_URL);
        const csvData = response.data;

        // 2. Parse CSV to JSON
        const parsed = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true
        });

        const rawRows = parsed.data;

        // 3. Clean and Deduplicate Data
        // Supabase da error si intentas actualizar el mismo ID dos veces en el mismo batch
        const uniqueItemsMap = new Map();

        rawRows.forEach(row => {
            const id = row['Idea Code']?.trim(); // Usar Idea Code como ID principal
            if (!id) return;

            const item = {
                id: id,
                title: row['Title'] || 'Untitled',
                description: row['Description'] || '',
                status_name: row['Status Name'] || '',
                category_name: row['Category Name'] || '',
                start_date: row['Start Date'] || null,
                end_date: row['End Date'] || null,
                date_created: row['Date Created'] || null,
                result: row['Result'] || 'Unknown',
                url: row['URL'] || '',
                elx_markets: row['ELX markets'] || '',
                aeg_markets: row['AEG Markets'] || '',
                page_type: row['Page Type'] || '',
                updated_at: new Date().toISOString()
            };

            uniqueItemsMap.set(id, item);
        });

        const processedItems = Array.from(uniqueItemsMap.values());

        console.log(`Found ${rawRows.length} rows. Cleaned to ${processedItems.length} unique items.`);
        console.log('Cleaning existing records and syncing to Supabase...');

        // 4. Clean sync: Delete all records first to avoid duplicates from previous key formats
        const { error: deleteError } = await supabase
            .from('experiments')
            .delete()
            .neq('id', '0'); // Safe delete all

        if (deleteError) throw deleteError;

        // 5. Upsert to Supabase
        const { error: upsertError } = await supabase
            .from('experiments')
            .upsert(processedItems);

        if (upsertError) throw upsertError;

        console.log('Sync completed successfully!');
    } catch (err) {
        console.error('Sync failed:', err.message);
        process.exit(1);
    }
}

sync();
