const { default: axios } = require('axios');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const key = process.env.DIGIFLAZZ_PRODUCTION_KEY || process.env.DIGIFLAZZ_DEV_KEY;
  const sign = crypto.createHash('md5').update(username + key + 'depo').digest('hex');
  
  console.time('fetch');
  const res = await axios.post('https://api.digiflazz.com/v1/price-list', {
    cmd: "prepaid",
    username,
    sign
  });
  console.timeEnd('fetch');
  console.log('Prepaid count:', res.data.data ? res.data.data.length : res.data);
}
check();
