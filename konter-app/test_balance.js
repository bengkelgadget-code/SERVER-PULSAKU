require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

async function testBalance() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const key = 'dev-e4cae4a0-4b73-11f1-836d-b1d70015d114';
  console.log('User:', username);
  console.log('Key:', key);

  const sign = crypto.createHash('md5').update(username + key + 'depo').digest('hex');

  const res = await fetch('https://api.digiflazz.com/v1/cek-saldo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: 'deposit', username, sign })
  });

  console.log(res.status, await res.text());
}

testBalance();
