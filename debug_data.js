
import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';

const SHEET_ID = '1GyEh5_D5uM1yETFZByUQmz44uuBYdZrcvilayJJK6OA';
const GID = '0';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

console.log("Fetching data from:", CSV_URL);

fetch(CSV_URL)
    .then(res => res.text())
    .then(csv => {
        Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                console.log(`Total items in spreadsheet: ${data.length}`);

                const stats = {
                    noStartDate: 0,
                    noEndDate: 0,
                    noDates: 0,
                    statuses: {},
                    sampleMissingDates: []
                };

                const processed = data.map(row => {
                    const statusRaw = row['Status Name'] || '';
                    const statusClean = statusRaw.replace(/^\d+\s+/, '');
                    const startDate = row['Start Date'];
                    const endDate = row['End Date'];

                    if (!startDate) stats.noStartDate++;
                    if (!endDate) stats.noEndDate++;
                    if (!startDate && !endDate) {
                        stats.noDates++;
                        if (stats.sampleMissingDates.length < 5) {
                            stats.sampleMissingDates.push({ id: row['ID'], title: row['Title'], status: statusClean });
                        }
                    }

                    stats.statuses[statusClean] = (stats.statuses[statusClean] || 0) + 1;

                    return { ...row, statusClean };
                });

                console.log("\n--- Stats ---");
                console.log("No Start Date:", stats.noStartDate);
                console.log("No End Date:", stats.noEndDate);
                console.log("No Dates at all:", stats.noDates);
                console.log("\n--- Status Distribution (Clean) ---");
                console.table(stats.statuses);

                console.log("\n--- Sample items with no dates ---");
                console.table(stats.sampleMissingDates);

                // Simulate current filtering logic
                const today = new Date();
                const startB = new Date(today);
                startB.setDate(today.getDate() - 60);
                const endB = new Date(today);
                endB.setDate(today.getDate() + 60);

                const filtered = data.filter(row => {
                    const startDate = row['Start Date'] ? new Date(row['Start Date']) : null; // simplified parse
                    const endDate = row['End Date'] ? new Date(row['End Date']) : null;

                    if (!startDate || !endDate) return false;
                    return true; // overlapping is more complex but this shows basic filtering
                });

                console.log(`\nItems that would stay with CURRENT mandatory date filtering: ${filtered.length}`);
            }
        });
    });
