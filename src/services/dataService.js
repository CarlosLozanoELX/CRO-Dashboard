import Papa from 'papaparse';
import { parse, isValid, format } from 'date-fns';

const SHEET_ID = '1GyEh5_D5uM1yETFZByUQmz44uuBYdZrcvilayJJK6OA';
const GID = '0';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

export const fetchExperimentData = async () => {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleanedData = processData(results.data);
        resolve(cleanedData);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

const processData = (data) => {
  return data.map(row => {
    // 1. Clean Description (remove HTML)
    const cleanDescription = row['Description']?.replace(/<[^>]*>?/gm, '') || '';

    // 2. Parse Markets (comma separated -> array)
    const elxMarkets = row['ELX markets'] ? row['ELX markets'].split(',').map(m => m.trim()) : [];
    const aegMarkets = row['AEG Markets'] ? row['AEG Markets'].split(',').map(m => m.trim()) : [];
    const allMarkets = [...new Set([...elxMarkets, ...aegMarkets])];

    // 3. Clean Status Name (remove leading numbers)
    // e.g., "3 Planning" -> "Planning"
    const statusRaw = row['Status Name'] || '';
    const statusClean = statusRaw.replace(/^\d+\s+/, '');

    // 4. Normalize Dates
    // Formats: "YYYY-MM-DD hh:mm:ss" or "DD/MM/YYYY"
    const parseDate = (dateStr) => {
      if (!dateStr) return null;

      const formats = [
        'yyyy-MM-dd HH:mm:ss',
        'MM/dd/yyyy', // Moved up: US format seems to be the source based on "01/16/2026"
        'MM/dd/yy',   // Moved up
        'dd/MM/yyyy', // Moved down: Only tried if US format fails (e.g. 13/01/2025)
        'yyyy-MM-dd',
        'M/d/yyyy',
        'M/d/yy',
        'd/M/yyyy'
      ];

      for (const fmt of formats) {
        const date = parse(dateStr, fmt, new Date());
        if (isValid(date)) {
          // Fix for 2-digit years being parsed as 00xx (e.g. 25 -> 0025)
          const year = date.getFullYear();
          if (year < 100) {
            date.setFullYear(year + 2000);
          }
          return date;
        }
      }

      return null;
    };

    const startDate = parseDate(row['Start Date']);
    const endDate = parseDate(row['End Date']);
    const dateCreated = parseDate(row['Date Created']);

    // 5. Normalize Result
    let result = row['Result'] || 'Unknown';
    if (result.toLowerCase() === 'looser') result = 'Loser';

    const today = new Date();
    const isOverdue = statusClean === 'Running' && endDate && endDate < today;
    const isDelayed = (statusClean === 'Planning' || statusClean === 'Development') && startDate && startDate < today;
    const isCompleted = statusClean === 'Completed' || (endDate && endDate < today);

    // Smart Status for UI display
    let displayStatus = statusClean;
    if (isOverdue) displayStatus = 'Completed'; // Auto-categorize as completed if date passed
    if (statusClean === 'Running' && endDate && endDate < today) {
      displayStatus = 'Analysis'; // Items that just finished are usually in Analysis
    }

    return {
      ...row,
      id: row['ID'],
      cleanDescription,
      elxMarkets,
      aegMarkets,
      allMarkets,
      statusClean,
      displayStatus,
      isOverdue,
      isDelayed,
      isCompleted,
      startDate,
      endDate,
      dateCreated,
      resultNormalized: result,
      workstream: row['Category Name'] || 'Unassigned',
      url: row['URL'] || ''
    };
  });
};
