import crypto from 'crypto'

export interface DigiFlazzPriceListResponse {
  data: {
    product_name: string;
    category: string;
    brand: string;
    type: string;
    seller_name: string;
    price: number;
    buyer_sku_code: string;
    buyer_product_status: boolean;
    seller_product_status: boolean;
    unlimited_stock: boolean;
    stock: number;
    multi: boolean;
    start_cut_off: string;
    end_cut_off: string;
    desc: string;
  }[];
}

export interface DigiFlazzBalanceResponse {
  data: {
    deposit: number;
  };
}

export interface DigiFlazzTransactionResponse {
  data: {
    ref_id: string;
    customer_no: string;
    buyer_sku_code: string;
    message: string;
    status: string; // 'Pending' | 'Sukses' | 'Gagal'
    rc: string;
    sn: string;
    buyer_last_saldo: number;
    price: number;
  }
}


export class DigiFlazzClient {
  private username: string;
  private apiKey: string;
  private baseUrl = 'https://api.digiflazz.com/v1';

  constructor() {
    this.username = process.env.DIGIFLAZZ_USERNAME || '';
    this.apiKey = process.env.DIGIFLAZZ_PRODUCTION_KEY || '';
    
    if (!this.username || !this.apiKey) {
      console.warn("DigiFlazz credentials are not set in environment variables");
    }
  }

  private generateSignature(command: string): string {
    return crypto
      .createHash('md5')
      .update(this.username + this.apiKey + command)
      .digest('hex');
  }

  async getPriceList(command: 'prepaid' | 'postpaid' = 'prepaid'): Promise<DigiFlazzPriceListResponse> {
    const signature = this.generateSignature('depo');
    
    const response = await fetch(`${this.baseUrl}/price-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cmd: command,
        username: this.username,
        sign: signature,
      }),
      // No cache to ensure we always get the latest price and avoid caching errors
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`DigiFlazz API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getBalance(): Promise<number> {
    const signature = this.generateSignature('depo');
    
    const response = await fetch(`${this.baseUrl}/cek-saldo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cmd: 'deposit',
        username: this.username,
        sign: signature,
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`DigiFlazz API Error: ${response.statusText}`);
    }

    const json = await response.json() as DigiFlazzBalanceResponse;
    return json.data.deposit;
  }

  async createTransaction(sku_code: string, customer_no: string, ref_id: string): Promise<DigiFlazzTransactionResponse> {
    const signature = this.generateSignature(ref_id);

    const response = await fetch(`${this.baseUrl}/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.username,
        buyer_sku_code: sku_code,
        customer_no: customer_no,
        ref_id: ref_id,
        sign: signature,
        testing: this.apiKey.startsWith('dev-') ? true : undefined,
      }),
    });

    const data = await response.json().catch(() => null);
    
    if (!response.ok && !data) {
      throw new Error(`DigiFlazz Transaction API Error: ${response.statusText}`);
    }

    return data;
  }

  async inquiryPln(customer_no: string): Promise<{ name: string; segment_power: string } | null> {
    // For inquiry PLN, signature = md5(username + apiKey + customer_no)
    const signature = crypto
      .createHash('md5')
      .update(this.username + this.apiKey + customer_no)
      .digest('hex');

    try {
      const response = await fetch(`${this.baseUrl}/inquiry-pln`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          customer_no: customer_no,
          sign: signature,
        }),
      });

      const data = await response.json();
      console.log('DigiFlazz inquiry PLN response:', JSON.stringify(data));
      
      // DigiFlazz returns { data: { name, segment_power, ... } }
      if (data && data.data && data.data.name) {
        return {
          name: data.data.name,
          segment_power: data.data.segment_power || '',
        };
      }
      return null;
    } catch (e) {
      console.error('Inquiry PLN failed:', e);
      return null;
    }
  }
}
export const digiflazz = new DigiFlazzClient();
