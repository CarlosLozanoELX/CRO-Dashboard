
import Papa from 'papaparse';

const SHEET_ID = '1GyEh5_D5uM1yETFZByUQmz44uuBYdZrcvilayJJK6OA';
const GID = '0';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

async function check() {
    console.log("Checking for overlapping experiments outside strict start range...");
    const res = await fetch(CSV_URL);
    const csv = await res.text();

    Papa.parse(csv, {
        header: true,
        complete: (results) => {
            const winnersOverlapNotStart = [];
            const losersOverlapNotStart = [];

            const today = new Date('2026-01-13');
            const startRange = new Date(today);
            startRange.setDate(today.getDate() - 305);
            const endRange = new Date(today);
            endRange.setDate(today.getDate() + 60);

            results.data.forEach(row => {
                let r = row['Result'] || 'Unknown';
                if (r.toLowerCase() === 'looser') r = 'Loser';

                const parseDate = (d) => {
                    if (!d) return null;
                    const nd = new Date(d);
                    return isNaN(nd) ? null : nd;
                };

                const start = parseDate(row['Start Date']);
                const end = parseDate(row['End Date']);

                // OVERLAP logic but NOT START in range
                if (start && end) {
                    const overlaps = (start <= endRange && end >= startRange);
                    const startsInRange = (start >= startRange && start <= endRange);

                    if (overlaps && !startsInRange) {
                        if (r === 'Winner') winnersOverlapNotStart.push({ id: row['Idea Code'], start: row['Start Date'], end: row['End Date'] });
                        if (r === 'Loser') losersOverlapNotStart.push({ id: row['Idea Code'], start: row['Start Date'], end: row['End Date'] });
                    }
                }
            });

            console.log('\n--- Winners Overlapping but Started BEFORE range ---');
            console.table(winnersOverlapNotStart);
            console.log('\n--- Losers Overlapping but Started BEFORE range ---');
            console.table(losersOverlapNotStart);
        }
    });
}

check();
