/**
 * TRON Multi-Signature Service Type Definitions
 */

// ==================== Configuration Types ====================

export interface ClientConfig {
  baseURL: string;
  secretId: string;
  secretKey: string;
  channel: string;
}

export interface RequestHeaders {
  sign_version: string;
  ts: number;
  address: string;
  channel: string;
  uuid: string;
  secret_id: string;
  sign: string;
}

// ==================== Permission Related Types ====================

export interface Permission {
  operations: string;
  threshold: number;
  weight: number;
}

export interface AddressAuth {
  owner_address: string;
  owner_permission: Permission;
  active_permissions: Permission[];
}

export interface AuthResponse {
  code: number;
  message: string;
  data: AddressAuth[];
}

// ==================== Transaction Related Types ====================

export interface TransactionContract {
  type: string;
  parameter: {
    value: Record<string, any>;
    type_url: string;
  };
  provider?: string | null;
  ContractName?: string | null;
  Permission_id?: number;
}

export interface TransactionRawData {
  ref_block_bytes: string;
  ref_block_num?: number | null;
  ref_block_hash: string;
  expiration: number;
  auths?: any[] | null;
  data?: string;
  contract: TransactionContract[];
  scripts?: string;
  timestamp: number;
  fee_limit?: number | null;
}

export interface Transaction {
  txID?: string;
  raw_data: TransactionRawData;
  signature?: string[];
  raw_data_hex?: string;
  visible?: boolean;
}

export interface SubmitTransactionParams {
  address: string;
  function_selector?: string;
  transaction: Transaction;
}

// ==================== Transaction List Related Types ====================

export interface SignatureProgress {
  address: string;
  weight: number;
  is_sign: number;
  sign_time: number;
}

export interface TransactionDetail {
  hash: string;
  contract_type: string;
  originator_address: string;
  expire_time: number;
  threshold: number;
  current_weight: number;
  is_sign: number;
  signature_progress: SignatureProgress[];
  contract_data: Record<string, any>;
  current_transaction: Transaction;
  state: number;
  function_selector?: string;
}

export interface TransactionListParams {
  address: string;
  start: number;
  limit: number;
  is_sign?: boolean;
  state: number;
}

export interface TransactionListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    range_total: number;
    data: TransactionDetail[];
  };
}

// ==================== WebSocket Related Types ====================

export interface WebSocketSubscribe {
  address: string;
  version: string;
}

// The initial subscription reply is an array of pending transactions; each
// subsequent push is a single updated transaction object. Matches the
// onPendingTransaction callback signature.
export type WebSocketMessage = TransactionDetail | TransactionDetail[];

// ==================== Common Response Types ====================

export interface BaseResponse {
  code: number;
  message: string;
}

export interface SubmitTransactionResponse extends BaseResponse {
  data?: any;
}
