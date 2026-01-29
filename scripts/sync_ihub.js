import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import fs from 'fs';
import Papa from 'papaparse';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://byjysjabscpnbxwomhac.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5anlzamFic2NwbmJ4d29taGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwNTQyNSwiZXhwIjoyMDg1MDgxNDI1fQ.39s3tBwcqx9EbWW3HbGICw55Xy02H4A8DJ-WbcKzhXA';

const BRIGHTIDEA_CLIENT_ID = 'b7bbb97ffb7f11f0b1620e34d1a54935';
const BRIGHTIDEA_CLIENT_SECRET = '81af9e012d7731696ebb803729adcec2';
const BRIGHTIDEA_CAMPAIGN_ID = '149ED688-5303-11EF-94D4-0AB688EFA52D'; // OR - Experimentation
const TOKEN_PATH = './.brightidea_tokens.json';

const SHEET_ID = '1GyEh5_D5uM1yETFZByUQmz44uuBYdZrcvilayJJK6OA';
const LEGACY_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function stripHtml(html) {
    if (!html) return '';
    // Basic HTML tag stripping
    return html.replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

async function fetchLegacyResults() {
    console.log('Fetching legacy results from Google Sheets...');
    try {
        const response = await axios.get(LEGACY_CSV_URL);
        const parsed = Papa.parse(response.data, { header: true, skipEmptyLines: true });

        const legacyDataMap = new Map();
        parsed.data.forEach((row, index) => {
            const uuid = row['ID'];
            const expCode = row['Idea Code'];
            const result = row['Result'];
            const pageType = row['Page Type'];

            const startDate = row['Start Date'];
            const endDate = row['End Date'];

            const entry = {};
            if (result && result !== 'Unknown') entry.result = result.trim();
            if (pageType && !pageType.startsWith('http')) entry.pageType = pageType.trim();
            if (startDate) entry.startDate = startDate.trim();
            if (endDate) entry.endDate = endDate.trim();

            if (Object.keys(entry).length > 0) {
                if (uuid) legacyDataMap.set(uuid.trim(), entry);
                if (expCode) legacyDataMap.set(expCode.trim(), entry);
            }
        });

        console.log(`Loaded enrichment data for ${legacyDataMap.size} identifiers.`);
        return legacyDataMap;
    } catch (err) {
        console.warn('Could not fetch legacy results, proceeding with API data only:', err.message);
        return new Map();
    }
}

async function getValidToken() {
    if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error('Tokens file not found. Run bootstrap first.');
    }

    let tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));

    // Refresh if expired or about to expire (within 5 mins)
    if (Date.now() > tokens.expires_at - 300000) {
        console.log('Refreshing BrightIdea token...');
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('client_id', BRIGHTIDEA_CLIENT_ID);
        params.append('client_secret', BRIGHTIDEA_CLIENT_SECRET);
        params.append('refresh_token', tokens.refresh_token);

        const res = await axios.post('https://auth.brightidea.com/_oauth2/token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        tokens = {
            access_token: res.data.access_token,
            refresh_token: res.data.refresh_token || tokens.refresh_token,
            expires_at: Date.now() + (res.data.expires_in * 1000)
        };

        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log('Token refreshed successfully.');
    }

    return tokens.access_token;
}

async function fetchAllIdeas(accessToken) {
    let allIdeas = [];
    let page = 1;
    let totalPages = 1;

    console.log('Fetching ideas from BrightIdea API...');

    do {
        console.log(`Fetching page ${page}...`);
        const res = await axios.get('https://ihub.electrolux.com/api3/idea', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
                page: page,
                page_size: 100,
                with: 'additional_questions',
                campaign_id: BRIGHTIDEA_CAMPAIGN_ID
            }
        });

        if (res.data && res.data.idea_list) {
            allIdeas = allIdeas.concat(res.data.idea_list);
            totalPages = res.data.stats.page_count;
        }
        page++;
    } while (page <= totalPages);

    return allIdeas;
}

function mapIdeaToExperiment(idea, legacyData) {
    const questions = idea.additional_questions || [];

    const getAnswer = (desc) => {
        const q = questions.find(q => q.description && q.description.toLowerCase().includes(desc.toLowerCase()));
        return q ? q.response_text : null;
    };

    const id = idea.idea_code || idea.id;
    const legacy = legacyData.get(id) || {};

    // Result mapping
    let result = legacy.result || getAnswer('Final Result') || getAnswer('Winner') || 'Unknown';
    if (result.toLowerCase().includes('winner')) result = 'Winner';
    if (result.toLowerCase().includes('loser') || result.toLowerCase().includes('looser')) result = 'Loser';
    if (result.toLowerCase().includes('inconclusive')) result = 'Inconclusive';

    // Page Type mapping & URL filtering
    let pageType = legacy.pageType || '';
    if (!pageType) {
        const suggestedPage = getAnswer('Suggested page');
        if (suggestedPage && !suggestedPage.startsWith('http')) {
            pageType = suggestedPage;
        }
    }

    // Market extraction with correct iHub question names
    const elxMarket = getAnswer('Suggested Electrolux Market') || // Matches "Suggested Electrolux Market/s"
        getAnswer('What Electrolux market?') ||                   // Legacy fallback
        getAnswer('Electrolux market') ||
        '';
    const aegMarket = getAnswer('Suggested AEG market') ||        // Matches "Suggested AEG market?"
        getAnswer('What AEG market?') ||                          // Legacy fallback
        getAnswer('AEG market') ||
        '';

    return {
        id: id,
        title: idea.title || 'Untitled',
        description: stripHtml(idea.description) || '',
        status_name: idea.status?.name || 'New',
        category_name: idea.category?.name || '',
        start_date: legacy.startDate || idea.date_created,
        end_date: legacy.endDate || idea.campaign?.end_date || null,
        date_created: idea.date_created,
        page_type: pageType,
        elx_markets: elxMarket,
        aeg_markets: aegMarket,
        result: result,
        url: idea.url || '',
        updated_at: new Date().toISOString()
    };
}

async function sync() {
    try {
        const accessToken = await getValidToken();

        // 1. Fetch Legacy Data for Results Enrichment
        const legacyResults = await fetchLegacyResults();

        // 2. Fetch API Data
        const ideas = await fetchAllIdeas(accessToken);

        console.log(`Processing ${ideas.length} ideas with Hybrid Enrichment...`);
        const processedItems = ideas.map(idea => mapIdeaToExperiment(idea, legacyResults));

        console.log('Cleaning existing records and syncing to Supabase...');

        // 3. Clean sync
        const { error: deleteError } = await supabase
            .from('experiments')
            .delete()
            .neq('id', '0');

        if (deleteError) throw deleteError;

        // 4. Upsert in batches of 100
        for (let i = 0; i < processedItems.length; i += 100) {
            const batch = processedItems.slice(i, i + 100);
            const { error: upsertError } = await supabase
                .from('experiments')
                .upsert(batch);
            if (upsertError) throw upsertError;
            console.log(`Synced batch ${Math.floor(i / 100) + 1}...`);
        }

        console.log('Sync completed successfully!');
    } catch (err) {
        console.error('Sync failed:', err.message);
        if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
        process.exit(1);
    }
}

sync();
