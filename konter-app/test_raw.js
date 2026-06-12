const { default: axios } = require("axios");
const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

async function check() {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const key = process.env.DIGIFLAZZ_PRODUCTION_KEY;
  const sign = crypto.createHash("md5").update(username + key + "depo").digest("hex");
  
  const res = await axios.post("https://api.digiflazz.com/v1/price-list", {
    cmd: "prepaid", username, sign
  });
  
  const rawData = res.data;
  console.log("Top-level keys:", Object.keys(rawData));
  console.log("Status:", res.status);
  console.log("data type:", typeof rawData.data);
  console.log("data sample:", JSON.stringify(rawData.data).substring(0, 200));
}
check().catch(console.error);
