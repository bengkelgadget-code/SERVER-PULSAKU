const { default: axios } = require('axios');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const key = process.env.DIGIFLAZZ_PRODUCTION_KEY || process.env.DIGIFLAZZ_DEV_KEY;
  const sign = crypto.createHash('md5').update(username + key + 'depo').digest('hex');
  
  const [prepaidRes, postpaidRes] = await Promise.allSettled([
      axios.post('https://api.digiflazz.com/v1/price-list', { cmd: "prepaid", username, sign }),
      axios.post('https://api.digiflazz.com/v1/price-list', { cmd: "postpaid", username, sign })
  ]);
  
  let allProducts = [];
  if (prepaidRes.status === 'fulfilled') allProducts = allProducts.concat(prepaidRes.value.data.data || []);
  if (postpaidRes.status === 'fulfilled') allProducts = allProducts.concat(postpaidRes.value.data.data || []);
  
  const skus = allProducts.map(p => p.buyer_sku_code);
  const uniqueSkus = new Set(skus);
  console.log('Total:', skus.length, 'Unique:', uniqueSkus.size);
  if (skus.length !== uniqueSkus.size) {
    const duplicates = skus.filter((item, index) => skus.indexOf(item) !== index);
    console.log('Duplicates:', new Set(duplicates));
  }
}
check();
