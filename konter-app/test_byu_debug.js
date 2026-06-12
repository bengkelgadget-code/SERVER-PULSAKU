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
  
  const data = res.data.data;
  console.log("Type of data:", typeof data, Array.isArray(data));
  if(data && data.length > 0) {
    console.log("Sample product keys:", Object.keys(data[0]));
    console.log("Sample product:", JSON.stringify(data[0]));
    
    const byu = data.filter(p => p.brand && p.brand.toLowerCase().includes("by.u"));
    console.log("\nby.U count:", byu.length);
    console.log("by.U sample:", JSON.stringify(byu[0]));
  }
}
check().catch(console.error);
