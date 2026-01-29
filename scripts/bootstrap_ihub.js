import axios from 'axios';
import fs from 'fs';
import readline from 'readline';

// --- CONFIGURATION ---
const BRIGHTIDEA_CLIENT_ID = 'b7bbb97ffb7f11f0b1620e34d1a54935';
const BRIGHTIDEA_CLIENT_SECRET = '81af9e012d7731696ebb803729adcec2';
const TOKEN_PATH = './.brightidea_tokens.json';

const AUTH_URL = 'https://auth.brightidea.com/_oauth2/authorize';
const TOKEN_URL = 'https://auth.brightidea.com/_oauth2/token';
const REDIRECT_URI = 'https://ihub.electrolux.com/experimentation'; // Must match OAuth app config

console.log('=== BrightIdea OAuth2 Bootstrap ===\n');

console.log('Step 1: Open this URL in your browser:\n');
const authUrl = `${AUTH_URL}?client_id=${BRIGHTIDEA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
console.log(authUrl);
console.log('\nStep 2: After authorizing, you will receive an authorization code.');
console.log('Copy that code and paste it below.\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter authorization code: ', async (code) => {
    rl.close();

    try {
        console.log('\nExchanging authorization code for tokens...');

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', BRIGHTIDEA_CLIENT_ID);
        params.append('client_secret', BRIGHTIDEA_CLIENT_SECRET);
        params.append('code', code.trim());
        params.append('redirect_uri', REDIRECT_URI);

        const response = await axios.post(TOKEN_URL, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const tokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_at: Date.now() + (response.data.expires_in * 1000)
        };

        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        console.log('\n✅ Tokens saved successfully to', TOKEN_PATH);
        console.log('You can now run: node scripts/sync_ihub.js');
    } catch (err) {
        console.error('\n❌ Failed to obtain tokens:');
        console.error(err.response?.data || err.message);
        process.exit(1);
    }
});
