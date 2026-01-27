import { parse, isValid } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://byjysjabscpnbxwomhac.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5anlzamFic2NwbmJ4d29taGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDU0MjUsImV4cCI6MjA4NTA4MTQyNX0.1pHj3Olnjg-TnUYiF1gmmm_cjp8EeNFAoHnL4y172Ao'; // Usa tu ANON key aquí

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchExperimentData = async () => {
  try {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .order('date_created', { ascending: false });

    if (error) {
      console.error('Supabase fetch error details:', error);
      throw new Error(`Supabase error: ${error.message} (${error.code})`);
    }

    if (!data) {
      throw new Error('No data returned from Supabase.');
    }

    return processData(data);
  } catch (err) {
    console.error('Full connection error:', err);
    throw err;
  }
};

const processData = (data) => {
  return data.map(row => {
    // 1. Clean Description (remove HTML)
    const cleanDescription = row['description']?.replace(/<[^>]*>?/gm, '') || '';

    // 2. Parse Markets (comma separated -> array)
    const elxMarkets = row['elx_markets'] ? row['elx_markets'].split(',').map(m => m.trim()) : [];
    const aegMarkets = row['aeg_markets'] ? row['aeg_markets'].split(',').map(m => m.trim()) : [];
    const allMarkets = [...new Set([...elxMarkets, ...aegMarkets])];

    // 3. Clean Status Name (remove leading numbers)
    const statusRaw = row['status_name'] || '';
    const statusClean = statusRaw.replace(/^\d+\s+/, '');

    // 4. Normalize Dates
    const parseDate = (dateStr) => {
      if (!dateStr || typeof dateStr !== 'string') return null;
      const date = new Date(dateStr);
      return isValid(date) ? date : null;
    };

    const startDate = parseDate(row['start_date']);
    const endDate = parseDate(row['end_date']);
    const dateCreated = parseDate(row['date_created']);

    // 5. Normalize Result
    let result = row['result'] || 'Unknown';
    if (result.toLowerCase() === 'looser') result = 'Loser';

    const today = new Date();
    const isOverdue = statusClean === 'Running' && endDate && endDate < today;
    const isDelayed = (statusClean === 'Planning' || statusClean === 'Development') && startDate && startDate < today;
    const isCompleted = statusClean === 'Completed' || (endDate && endDate < today);

    return {
      ...row,
      id: row['id'],
      title: row['title'],
      cleanDescription,
      elxMarkets,
      aegMarkets,
      allMarkets,
      statusClean,
      displayStatus: statusClean,
      isOverdue,
      isDelayed,
      isCompleted,
      startDate,
      endDate,
      dateCreated,
      resultNormalized: result,
      workstream: row['category_name'] || 'Unassigned',
      url: row['url'] || ''
    };
  });
};
