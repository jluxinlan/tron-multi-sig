/**
 * TRON Multi-Signature Service Client
 */

import axios, { AxiosInstance } from 'axios';
import {
  ClientConfig,
  AuthResponse,
  SubmitTransactionParams,
  SubmitTransactionResponse,
  TransactionListParams,
  TransactionListResponse,
  TransactionDetail,
  WebSocketSubscribe,
} from '../types';
import { generateAuthParams } from '../utils/signature';

// Check if in browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined';

// Import WebSocket (native for browser, ws package for Node.js)
let WebSocketImpl: any;
if (isBrowser) {
  WebSocketImpl = window.WebSocket;
} else {
  // Dynamically import ws package (Node.js only)
  try {
    WebSocketImpl = require('ws');
  } catch (e) {
    console.warn('ws package not found, WebSocket functionality will not work in Node.js environment');
  }
}

function isPlainObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && value != undefined;
}

export class MultiSigClient {
  private config: ClientConfig;
  private axiosInstance: AxiosInstance;
  private ws?: WebSocket;
  private pendingTransactionCallback?: (transaction: TransactionDetail[] | TransactionDetail) => void;

  constructor(config: ClientConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate authentication query parameters
   */
  private generateAuthQueryParams(method: string, path: string, address: string): Record<string, string | number> {
    return generateAuthParams(
      method,
      path,
      address,
      this.config.channel,
      this.config.secretId,
      this.config.secretKey
    );
  }

  /**
   * 1. Query addresses and permissions controlled by current address
   */
  async queryAuth(address: string): Promise<AuthResponse> {
    const path = '/openapi/multi/auth';
    const authParams = this.generateAuthQueryParams('GET', path, address);

    const response = await this.axiosInstance.get<AuthResponse>(path, {
      params: {
        address,
        ...authParams
      }
    });

    return response.data;
  }

  /**
   * 2. Create and submit multi-signature transaction
   */
  async submitTransaction(params: SubmitTransactionParams): Promise<SubmitTransactionResponse> {
    const path = '/openapi/multi/transaction';
    const authParams = this.generateAuthQueryParams('POST', path, params.address);

    const response = await this.axiosInstance.post<SubmitTransactionResponse>(
      path,
      params,
      {
        params: authParams
      }
    );

    return response.data;
  }

  /**
   * 3. Query transaction list
   */
  async queryTransactionList(params: TransactionListParams): Promise<TransactionListResponse> {
    const path = '/openapi/multi/list';
    const authParams = this.generateAuthQueryParams('GET', path, params.address);

    const response = await this.axiosInstance.get<TransactionListResponse>(path, {
      params: {
        ...params,
        ...authParams
      }
    });

    return response.data;
  }

  /**
   * 4. Establish WebSocket connection and subscribe to pending transactions
   */
  async connectWebSocket(address: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.config.baseURL.replace(/^http/, 'ws') + '/openapi/multi/socket';

        // Generate authentication parameters
        const authParams = generateAuthParams(
          'GET',
          '/openapi/multi/socket',
          address,
          this.config.channel,
          this.config.secretId,
          this.config.secretKey
        );

        // Add authentication parameters to URL query string
        const queryString = Object.entries(authParams)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');

        const fullUrl = `${wsUrl}?${queryString}`;

        this.ws = new WebSocketImpl(fullUrl) as WebSocket;

        // Browser environment: use addEventListener
        if (isBrowser) {
          this.ws.addEventListener('open', () => {
            console.log('WebSocket connection established');

            // Send subscription message
            const subscribeMessage: WebSocketSubscribe = {
              address,
              version: 'v1'
            };

            this.ws?.send(JSON.stringify(subscribeMessage));
            resolve();
          });

          this.ws.addEventListener('message', (event: MessageEvent) => {
            let data: TransactionDetail[] | TransactionDetail | undefined = undefined;
            try {
              data = JSON.parse(event.data);
            } catch (error) {
              return;
            }

            if (!Array.isArray(data) && !isPlainObject(data)) {
              return;
            }

            try {
              if (this.pendingTransactionCallback) {
                this.pendingTransactionCallback(data!);
              }
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error);
            }
          });

          this.ws.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            reject(error);
          });

          this.ws.addEventListener('close', () => {
            console.log('WebSocket connection closed');
          });
        } else {
          // Node.js environment: use .on() method
          (this.ws as any).on('open', () => {
            console.log('WebSocket connection established');

            // Send subscription message
            const subscribeMessage: WebSocketSubscribe = {
              address,
              version: 'v1'
            };

            this.ws?.send(JSON.stringify(subscribeMessage));
            resolve();
          });

          (this.ws as any).on('message', (wsData: any) => {
            let data: TransactionDetail[] | TransactionDetail | undefined = undefined;
            try {
              data = JSON.parse(wsData.toString());
            } catch (error) {
              return;
            }

            if (!Array.isArray(data) && !isPlainObject(data)) {
              return;
            }

            try {
              if (this.pendingTransactionCallback) {
                this.pendingTransactionCallback(data!);
              }
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error);
            }
          });

          (this.ws as any).on('error', (error: Error) => {
            console.error('WebSocket error:', error);
            reject(error);
          });

          (this.ws as any).on('close', () => {
            console.log('WebSocket connection closed');
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Listen for pending transactions
   */
  onPendingTransaction(callback: (transactions: TransactionDetail | TransactionDetail[]) => void): void {
    this.pendingTransactionCallback = callback;
  }

  /**
   * Disconnect WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}
