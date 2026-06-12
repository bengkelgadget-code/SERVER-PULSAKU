const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const proxyUrl = 'http://wrmldnfr:jwendz5xqb0h@38.154.203.95:5863';
const agent = new HttpsProxyAgent(proxyUrl);

const checkPrice = async () => {
  const data = new URLSearchParams({
    inquiry: 'PRICE'
  }).toString();

  try {
    const res = await axios.post('https://portalpulsa.com/api/connect/', data, {
      httpsAgent: agent,
      headers: {
        'portal-userid': 'P251447',
        'portal-key': 'de2b90151ff05d0787cdb3d3805eb1c8',
        'portal-secret': 'f5b8abfd85d382e7ef754d6152c6e16ba763253ad30beca905fd18474ab77b20',
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    console.log(JSON.stringify(res.data).substring(0, 500));
  } catch (err) {
    console.error(err);
  }
};

checkPrice();
