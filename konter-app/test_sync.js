const { syncDigiFlazzProducts } = require('./src/use-cases/products/sync-digiflazz.ts');

async function test() {
  console.time('sync');
  const res = await syncDigiFlazzProducts();
  console.log(res);
  console.timeEnd('sync');
}
test();
