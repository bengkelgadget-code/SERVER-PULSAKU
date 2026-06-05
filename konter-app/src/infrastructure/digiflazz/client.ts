import crypto from 'crypto'
import axios, { AxiosInstance } from 'axios'

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
  private httpClient: AxiosInstance;

  constructor() {
    this.username = process.env.DIGIFLAZZ_USERNAME || '';
    this.apiKey = process.env.DIGIFLAZZ_PRODUCTION_KEY || '';
    
    if (!this.username || !this.apiKey) {
      console.warn("DigiFlazz credentials are not set in environment variables");
    }

    const proxyHost = process.env.PROXY_HOST;
    const proxyPort = process.env.PROXY_PORT;
    const proxyUser = process.env.PROXY_USERNAME;
    const proxyPass = process.env.PROXY_PASSWORD;

    const axiosConfig: any = {
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Do not automatically throw error on HTTP 400 so we can parse DigiFlazz custom error body
    };

    if (proxyHost && proxyPort) {
      axiosConfig.proxy = {
        protocol: 'http',
        host: proxyHost,
        port: parseInt(proxyPort, 10),
        auth: (proxyUser && proxyPass) ? {
          username: proxyUser,
          password: proxyPass
        } : undefined
      };
      console.log(`[DigiFlazz Proxy] Terkoneksi menggunakan proxy: http://${proxyHost}:${proxyPort}`);
    } else {
      console.log(`[DigiFlazz Proxy] Berjalan langsung (Tanpa Proxy)`);
    }

    this.httpClient = axios.create(axiosConfig);
  }

  private generateSignature(command: string): string {
    return crypto
      .createHash('md5')
      .update(this.username + this.apiKey + command)
      .digest('hex');
  }

  async getPriceList(command: 'prepaid' | 'pasca' = 'prepaid'): Promise<DigiFlazzPriceListResponse> {
    const signature = this.generateSignature('depo');
    
    const response = await this.httpClient.post('/price-list', {
      cmd: command,
      username: this.username,
      sign: signature,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`DigiFlazz API Error: ${response.statusText || response.status}`);
    }

    return response.data;
  }

  async getBalance(): Promise<number> {
    const signature = this.generateSignature('depo');
    
    const response = await this.httpClient.post('/cek-saldo', {
      cmd: 'deposit',
      username: this.username,
      sign: signature,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`DigiFlazz API Error: ${response.statusText || response.status}`);
    }

    const json = response.data as DigiFlazzBalanceResponse;
    return json.data.deposit;
  }

  async createTransaction(sku_code: string, customer_no: string, ref_id: string): Promise<DigiFlazzTransactionResponse> {
    const signature = this.generateSignature(ref_id);

    const response = await this.httpClient.post('/transaction', {
      username: this.username,
      buyer_sku_code: sku_code,
      customer_no: customer_no,
      ref_id: ref_id,
      sign: signature,
      testing: this.apiKey.startsWith('dev-') ? true : undefined,
    });

    const data = response.data;
    const isOk = response.status >= 200 && response.status < 300;
    
    if (!isOk && !data) {
      throw new Error(`DigiFlazz Transaction API Error: ${response.statusText || response.status}`);
    }

    return data;
  }

  async inquiryPln(customer_no: string): Promise<{ name: string; segment_power: string } | null> {
    const signature = crypto
      .createHash('md5')
      .update(this.username + this.apiKey + customer_no)
      .digest('hex');

    try {
      const response = await this.httpClient.post('/inquiry-pln', {
        username: this.username,
        customer_no: customer_no,
        sign: signature,
      });

      const data = response.data;
      console.log('DigiFlazz inquiry PLN response:', JSON.stringify(data));
      
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

