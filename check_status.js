
import Papa from 'papaparse';

const SHEET_ID = '1GyEh5_D5uM1yETFZByUQmz44uuBYdZrcvilayJJK6OA';
const GID = '0';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

async function check() {
    const res = await fetch(CSV_URL);
    const csv = await res.text();

    Papa.parse(csv, {
        header: true,
        complete: (results) => {
            const statusNameCounts = {};
            const statusStageCounts = {};
            const allPossibleRunning = [];

            results.data.forEach(row => {
                const sn = row['Status Name'] || 'EMPTY';
                const ss = row['Status Stage'] || 'EMPTY';

                statusNameCounts[sn] = (statusNameCounts[sn] || 0) + 1;
                statusStageCounts[ss] = (statusStageCounts[ss] || 0) + 1;

                const isRunning = (sn && sn.toLowerCase().includes('running')) ||
                    (ss && ss.toLowerCase().includes('running')) ||
                    (sn && sn.toLowerCase().includes('live')) ||
                    (ss && ss.toLowerCase().includes('live'));

                if (isRunning) {
                    allPossibleRunning.push({
                        id: row['Idea Code'],
                        title: row['Title'] ? row['Title'].substring(0, 30) : 'N/A',
                        statusName: sn,
                        statusStage: ss,
                        endDate: row['End Date']
                    });
                }

                if (row['Idea Code'] === 'EXP72517') {
                    console.log('--- EXP72517 Detail ---');
                    console.log('Status Name:', row['Status Name']);
                    console.log('Status Stage:', row['Status Stage']);
                    console.log('Result:', row['Result']);
                    console.log('End Date:', row['End Date']);
                }
            });
            console.log('\n--- Status Name Counts ---');
            console.table(statusNameCounts);

            console.log('\n--- Status Stage Counts ---');
            console.table(statusStageCounts);

            console.log('\n--- All Possible "Running/Live" Items ---');
            console.table(allPossibleRunning);
        }
    });
}

check();
