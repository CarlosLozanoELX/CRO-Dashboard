import axios from 'axios';
import fs from 'fs';

// --- CONFIGURATION ---
const BRIGHTIDEA_CLIENT_ID = 'b7bbb97ffb7f11f0b1620e34d1a54935';
const BRIGHTIDEA_CLIENT_SECRET = '81af9e012d7731696ebb803729adcec2';
const TOKEN_PATH = './.brightidea_tokens.json';
const TOKEN_URL = 'https://auth.brightidea.com/_oauth2/token';
const REDIRECT_URI = 'https://ihub.electrolux.com/experimentation';

// Get code from command line argument
const code = process.argv[2];

if (!code) {
    console.error('Usage: node scripts/exchange_token.js <authorization_code>');
    process.exit(1);
}

console.log('Exchanging authorization code for tokens...');

const params = new URLSearchParams();
params.append('grant_type', 'authorization_code');
params.append('client_id', BRIGHTIDEA_CLIENT_ID);
params.append('client_secret', BRIGHTIDEA_CLIENT_SECRET);
params.append('code', code.trim());
params.append('redirect_uri', REDIRECT_URI);

axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
})
    .then(response => {
        const tokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_at: Date.now() + (response.data.expires_in * 1000)
        };

        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        console.log('\n✅ Tokens saved successfully to', TOKEN_PATH);
        console.log('You can now run: node scripts/sync_ihub.js');
    })
    .catch(err => {
        console.error('\n❌ Failed to obtain tokens:');
        console.error(err.response?.data || err.message);
        process.exit(1);
    });
