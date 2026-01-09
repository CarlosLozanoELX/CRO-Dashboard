
import { parse, isValid } from 'date-fns';

const parseDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;

    const trimmedDate = dateStr.trim();
    if (!trimmedDate) return null;

    // Try native parse first for standard ISO-like strings
    const nativeDate = new Date(trimmedDate);
    if (isValid(nativeDate) && trimmedDate.includes('-') && trimmedDate.length >= 10) {
        return nativeDate;
    }

    const formats = [
        'yyyy-MM-dd HH:mm:ss',
        'MM/dd/yyyy',
        'MM/dd/yy',
        'dd/MM/yyyy',
        'dd/MM/yy',
        'yyyy-MM-dd',
        'M/d/yyyy',
        'M/d/yy',
        'd/M/yyyy',
        'd/M/yy'
    ];

    for (const fmt of formats) {
        const date = parse(trimmedDate, fmt, new Date());
        if (isValid(date)) {
            const year = date.getFullYear();
            if (year < 100) {
                date.setFullYear(year + 2000);
            }
            return date;
        }
    }

    return null;
};

const testCases = [
    "2025-10-20 8:28:35",
    "02/26/2026",
    "01/14/26",
    " 12/25/2024 ",
    "2024-12-31",
    "1/1/25",
    "31/12/2024"
];

console.log("Testing Date Parsing:");
testCases.forEach(tc => {
    const result = parseDate(tc);
    console.log(`Input: "${tc}" => Result: ${result ? result.toISOString() : 'FAILED'}`);
});
