/**
 * Signature Utility Module
 * Uses crypto module (Node.js native / crypto-browserify)
 */

import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate UUID
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Sort parameters and join as string
 */
export function sortAndJoinParams(params: Record<string, any>): string {
  const keys = Object.keys(params).sort();
  return keys.map(key => `${key}=${params[key]}`).join('&');
}

/**
 * Build signature string
 * Format: request method + request path + ? + parameters string
 */
export function buildSignString(method: string, path: string, params: Record<string, any>): string {
  const queryString = sortAndJoinParams(params);
  return `${method}${path}?${queryString}`;
}

/**
 * Generate HmacSHA256 signature
 * Uses crypto module (Node.js native or crypto-browserify)
 */
export function generateSign(message: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Generate complete authentication parameters
 */
export function generateAuthParams(
  method: string,
  path: string,
  address: string,
  channel: string,
  secretId: string,
  secretKey: string
): Record<string, string | number> {
  const params = {
    address,
    channel,
    secret_id: secretId,
    sign_version: 'v1',
    ts: Date.now(),
    uuid: generateUUID()
  };

  const signString = buildSignString(method, path, params);
  const sign = generateSign(signString, secretKey);

  return {
    ...params,
    sign
  };
}
