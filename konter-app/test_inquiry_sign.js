const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
} catch (e) {}

async function testSignatures() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_PRODUCTION_KEY;
  const proxyHost = process.env.PROXY_HOST;
  const proxyPort = process.env.PROXY_PORT;
  const proxyUser = process.env.PROXY_USERNAME;
  const proxyPass = process.env.PROXY_PASSWORD;
  const customer_no = '231122091141';

  const config = {
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
    proxy: proxyHost ? {
      protocol: 'http',
      host: proxyHost,
      port: parseInt(proxyPort, 10),
      auth: (proxyUser && proxyPass) ? { username: proxyUser, password: proxyPass } : undefined
    } : undefined
  };

  const tests = [
    { name: 'username + apiKey + customer_no', str: username + apiKey + customer_no },
    { name: 'username + apiKey + "inquiry"', str: username + apiKey + 'inquiry' },
    { name: 'username + apiKey + "pln"', str: username + apiKey + 'pln' },
    { name: 'username + apiKey + "inquirypln"', str: username + apiKey + 'inquirypln' },
    { name: 'username + apiKey + "inquiry_pln"', str: username + apiKey + 'inquiry_pln' },
  ];

  for (const t of tests) {
    const sign = crypto.createHash('md5').update(t.str).digest('hex');
    const res = await axios.post('https://api.digiflazz.com/v1/inquiry-pln', {
      username: username,
      customer_no: customer_no,
      sign: sign,
    }, config);
    console.log(`Test: ${t.name}`);
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(res.data)}`);
    console.log('---');
    if (res.data.data && res.data.data.rc !== '41') {
      break;
    }
  }
}

testSignatures();
