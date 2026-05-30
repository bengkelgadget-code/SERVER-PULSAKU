const crypto = require('crypto');

async function testDigiFlazz() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const key = process.env.DIGIFLAZZ_PRODUCTION_KEY;
  const sign = crypto.createHash('md5').update(`${username}${key}depo`).digest('hex');

  const payload = {
    cmd: "prepaid",
    username,
    sign
  };

  try {
    const res = await fetch('https://api.digiflazz.com/v1/price-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0, 500));
  } catch (err) {
    console.error("Error:", err);
  }
}

testDigiFlazz();
