const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

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
  console.log('Loaded .env.local successfully.');
} catch (e) {
  console.error('Failed to load .env.local:', e.message);
  process.exit(1);
}

async function testInquiryPln() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_PRODUCTION_KEY;
  const proxyHost = process.env.PROXY_HOST;
  const proxyPort = process.env.PROXY_PORT;
  const proxyUser = process.env.PROXY_USERNAME;
  const proxyPass = process.env.PROXY_PASSWORD;
  
  // The meter number from the user's screenshot
  const customer_no = '231122091141';

  console.log('DigiFlazz Username:', username);
  console.log('Using Proxy:', `${proxyHost}:${proxyPort}`);
  console.log('Customer No:', customer_no);
  console.log('');

  const sign = crypto.createHash('md5').update(username + apiKey + customer_no).digest('hex');

  const config = {
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  };

  if (proxyHost && proxyPort) {
    config.proxy = {
      protocol: 'http',
      host: proxyHost,
      port: parseInt(proxyPort, 10),
      auth: (proxyUser && proxyPass) ? { username: proxyUser, password: proxyPass } : undefined
    };
  }

  try {
    console.log('--- POST to /v1/inquiry-pln ---');
    const res1 = await axios.post('https://api.digiflazz.com/v1/inquiry-pln', {
      username: username,
      customer_no: customer_no,
      sign: sign,
    }, config);
    console.log('Status:', res1.status);
    console.log('Response:', JSON.stringify(res1.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testInquiryPln();
