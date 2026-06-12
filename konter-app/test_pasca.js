const { default: axios } = require('axios');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const key = process.env.DIGIFLAZZ_PRODUCTION_KEY || process.env.DIGIFLAZZ_DEV_KEY;
  const sign = crypto.createHash('md5').update(username + key + 'depo').digest('hex');
  
  const [pascaRes, postpaidRes, prepaidRes] = await Promise.allSettled([
      axios.post('https://api.digiflazz.com/v1/price-list', { cmd: "pasca", username, sign }),
      axios.post('https://api.digiflazz.com/v1/price-list', { cmd: "postpaid", username, sign }),
      axios.post('https://api.digiflazz.com/v1/price-list', { cmd: "prepaid", username, sign })
  ]);
  
  console.log('pasca:', pascaRes.value.data.data.length);
  console.log('postpaid:', postpaidRes.value.data.data.length);
  console.log('prepaid:', prepaidRes.value.data.data.length);
}
check();
