
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
            console.log("ID, Result, Start Date, End Date, Status");
            results.data.forEach(row => {
                let r = row['Result'] || '';
                if (r === 'Inconclusive') {
                    console.log(`${row['Idea Code']}, ${r}, ${row['Start Date']}, ${row['End Date']}, ${row['Status Name']}`);
                }
            });
        }
    });
}

check();
