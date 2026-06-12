const http = require('http');

http.get('http://localhost:3000/admin?category=Pulsa&brand=by.U', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode !== 200) {
      console.log(data.substring(0, 500));
    }
  });
}).on('error', err => console.error(err));
