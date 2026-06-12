import { digiflazz } from './src/infrastructure/digiflazz/client';
async function test() {
  const result = await digiflazz.inquiryPln('32130511218');
  console.log(result);
}
test();
