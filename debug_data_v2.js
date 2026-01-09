
import axios from 'axios';
import Papa from 'papaparse';

const SHEET_ID = '1GyEh5_D5uM1yETFZByUQmz44uuBYdZrcvilayJJK6OA';
const GID = '0';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

async function analyze() {
    console.log("Fetching CSV...");
    const response = await axios.get(CSV_URL);
    const csv = response.data;

    Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const data = results.data;
            console.log(`Total rows: ${data.length}`);

            const statusAnalysis = {};

            data.forEach(row => {
                const statusRaw = row['Status Name'] || 'EMPTY';
                const statusClean = statusRaw.replace(/^\d+\s+/, '');
                const startDate = row['Start Date'];
                const endDate = row['End Date'];

                if (!statusAnalysis[statusClean]) {
                    statusAnalysis[statusClean] = { count: 0, hasDates: 0, noDates: 0, sampleIds: [] };
                }

                statusAnalysis[statusClean].count++;
                if (startDate || endDate) {
                    statusAnalysis[statusClean].hasDates++;
                } else {
                    statusAnalysis[statusClean].noDates++;
                }

                if (statusAnalysis[statusClean].sampleIds.length < 3) {
                    statusAnalysis[statusClean].sampleIds.push(row['ID']);
                }
            });

            console.log("\n--- Status Analysis ---");
            console.table(Object.entries(statusAnalysis).map(([status, stats]) => ({
                Status: status,
                Count: stats.count,
                'Has Dates': stats['hasDates'],
                'No Dates': stats['noDates'],
                'Sample Ids': stats.sampleIds.join(', ')
            })));
        }
    });
}

analyze().catch(console.error);
