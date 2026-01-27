
import axios from 'axios';
import Papa from 'papaparse';

const SHEET_ID = '1GyEh5_D5uM1yETFZByUQmz44uuBYdZrcvilayJJK6OA';
const DATA_SOURCE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

async function inspect() {
    try {
        const response = await axios.get(DATA_SOURCE_URL);
        const csvData = response.data;
        const parsed = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true
        });

        const pageTypes = new Set();
        parsed.data.forEach(row => {
            if (row['Page Type']) pageTypes.add(row['Page Type']);
        });

        console.log('Unique Page Types found:', Array.from(pageTypes));
        console.log('Sample Row with Page Type:', parsed.data.find(r => r['Page Type']) || 'None found');
    } catch (err) {
        console.error('Inspection failed:', err.message);
    }
}

inspect();
