# Developer Guide: Integrating TRON Multisig Service for Wallets

## Table of Contents

- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Features](#features)
- [Core Functions & Usage](#core-functions--usage)
- [Multisignature Transaction Flow](#multisignature-transaction-flow)
- [API Reference](#api-reference)
    - [Common Response Structure](#common-response-structure)
    - [Error Codes](#error-codes)
    - [1. Query Multisignature Authorization Details](#1-query-multisignature-authorization-details)
    - [2. Submit Multisignature Transaction](#2-submit-multisignature-transaction)
    - [3. Pending Transaction Listener (WebSocket)](#3-pending-transaction-listener-websocket)
    - [4. Transaction List Query](#4-transaction-list-query)
- [API Authentication Specification](#api-authentication-specification)
    - [I. Common Request Parameters](#i-common-request-parameters)
    - [II. How to Pass Authentication Parameters](#ii-how-to-pass-authentication-parameters)
    - [III. API Request Signature Generation Rules](#iii-api-request-signature-generation-rules)
    - [IV. Key Application Process](#iv-key-application-process)
    - [V. Security Considerations](#v-security-considerations)
- [Enumerations Reference](#enumerations-reference)
- [Security Warning](#security-warning)
- [License](#license)

---

## Project Overview

This project demonstrates how to integrate with the TRON multisignature service, including basic API usage and WebSocket real-time monitoring, in both Node.js and browser (React) environments.

The TRON Multi-Signature Service is an application-layer multi-signature transaction service designed to manage permission verification, signature workflows, and execution control for multi-signature transactions without accessing private keys.

Developers can submit a pending on-chain transaction through this service. Based on the pre-configured multi-signature permission rules of the account, the service collects and validates signatures from multiple participants and advances the multi-signature workflow asynchronously. Once the accumulated signature weight meets the threshold defined by the on-chain account, the system automatically broadcasts the transaction to the blockchain and completes its execution.

> **The TRON Multi-Signature Service does not custody, generate, or use private keys. It is positioned as a keyless multi-signature transaction orchestration hub.**

> **Note:** This is a demo implementation, not a production-ready SDK. Use this as a reference only. For production, always keep your secrets on the backend.

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```env
BASE_URL=https://apinile.walletadapter.org
SECRET_ID=your-secret-id-here
SECRET_KEY=your-secret-key-here
CHANNEL=your-channel
TEST_ADDRESS=TYourTestAddressHere
```

| Environment | BASE_URL |
|---|---|
| Nile Testnet | `https://apinile.walletadapter.org` |
| Mainnet | `https://api.walletadapter.org` |


### 3. Run Examples

#### Node.js Examples

```bash
# Basic API usage: query permissions, submit transaction, query transaction list
pnpm example:basic

# WebSocket real-time listener: receive pending transactions
pnpm example:websocket
```

#### Web React Example

```bash
# Start development server with hot reload at http://localhost:3000
pnpm web:dev
```

The web demo provides a graphical interface to:
- Query address permissions
- Submit multisignature transactions
- View transaction lists
- WebSocket real-time monitoring

---

## Features

- Query multisignature permissions for an address
- Submit multisignature transactions
- Query transaction lists
- Real-time monitoring of pending transactions via WebSocket

---

## Core Functions & Usage

> For more details, see [`examples/node/basic-usage.ts`](examples/node/basic-usage.ts) and [`examples/node/websocket-demo.ts`](examples/node/websocket-demo.ts).

### 1. Initialize the Client

```ts
import { MultiSigClient } from './src/services/MultiSigClient';

const client = new MultiSigClient({
  baseUrl: process.env.BASE_URL,
  secretId: process.env.SECRET_ID,
  secretKey: process.env.SECRET_KEY,
  channel: process.env.CHANNEL,
});
```

### 2. Query Address Permissions

```ts
const permissions = await client.getAddressPermission(process.env.TEST_ADDRESS);
console.log('Permission Info:', permissions);
```

### 3. Submit Multisignature Transaction

```ts
const txResult = await client.submitTransaction({
  from: process.env.TEST_ADDRESS,
  to: 'Txxxxxxx',
  amount: 1000000,
  memo: 'Test transfer'
});
console.log('Transaction Result:', txResult);
```

### 4. Query Transaction List

```ts
const txList = await client.getTransactionList(process.env.TEST_ADDRESS, { limit: 10 });
console.log('Transaction List:', txList);
```

### 5. WebSocket Real-Time Monitoring

```ts
const ws = client.createWebSocket(process.env.TEST_ADDRESS);

ws.on('pending', (tx) => {
  console.log('Pending Transaction:', tx);
});

ws.on('error', (err) => {
  console.error('WebSocket Error:', err);
});
```

---

## Multisignature Transaction Flow

### Phase I. Constructing a Multisignature Transaction and Submitting It to the Service

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Query Auth  │────▶│  2. Construct   │────▶│  3. Submit TX   │
│  GET /multi/auth│     │  & Sign TX      │     │ POST /multi/    │
│                 │     │  (client-side)  │     │   transaction   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Query Multisignature Authorization Details for the Current Address**  
   Call the `/multi/auth` endpoint to retrieve all addresses over which the specified address has multisignature permissions. This step is intended to verify whether the current address has been properly authorized by the transaction initiator (i.e., the `owner_address`).

2. **Construct and Sign the Transaction**  
   Based on business requirements, construct a transaction object (`Transaction`) using the `owner_address`, and then sign the transaction with the current address.

3. **Submit the Transaction**  
   Call the `/multi/transaction` endpoint to submit the transaction to the multisignature service for subsequent processing.

### Phase II. Query Pending Transactions, Sign, and Submit

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 4. Listen for   │────▶│ 5. Sign the     │────▶│ 6. Submit via   │
│ pending TX      │     │ pending TX      │     │ POST /multi/    │
│ WS /multi/socket│     │ (client-side)   │     │   transaction   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Query Pending Transactions**  
   Establish a WebSocket connection via `/multi/socket` to listen in real time for pending signing tasks associated with the current address. This interface supports active message push, ensuring users are notified immediately of transactions requiring action.

2. **Sign and Submit the Transaction**  
   After signing, submit the transaction object again through `/multi/transaction`. The multisignature service automatically verifies signature validity and weight, and broadcasts the transaction once the threshold is met. Developers can track transaction progress using the returned transaction hash.

---

## API Reference

> **All APIs require authentication. Refer to [API Authentication Specification](#api-authentication-specification) for authentication details.**


### Common Response Structure

All REST API responses follow this structure:

| Field | Type | Description |
|---|---|---|
| `code` | int | Response code. `0` indicates success; non-zero indicates an error |
| `message` | string | Human-readable response message |
| `original_message` | string \| null | Original error message (if any) from upstream services |
| `data` | object \| array | Response payload (structure varies by API) |

### Error Codes

| Code  | Description                                                                 |
|-------|-----------------------------------------------------------------------------|
| 0     | Success                                                                     |
| 4000  | `sign` authentication failed                                                |
| 4002  | invalid `secret_id`                                                         |
| 4003  | expired `ts`                                                                |
| 4501  | Request too frequently                                                      |
| 20004 | has no some param (`sign`, `ts`, `version`, `channel`, `uuid`, `secret_id`) |
| 10001 | some server error                                                           |

> **Note:** The error codes above are representative examples. Please refer to the actual API response for the specific error code and message in your integration.

---
### 1. Query Multisignature Authorization Details

**API Endpoint:** `GET /multi/auth`
**Description:** Query all addresses over which the specified address has multisignature permissions.
- **Request Parameters:**

| Parameter | Type   | Required | Description                                 | Example                          |
|-----------|--------|----------|---------------------------------------------|----------------------------------|
| `address`   | string | Yes      | TRON Base58 address to query | `TXz9dfkjui6pdegFCV1fSee96MWRwms6DB` |

> Plus all [Common Request Parameters](#i-common-request-parameters) for authentication.

Returns an array of objects, each representing an `owner_address` that the queried address has permissions over:

| Field | Type | Description |
|---|---|---|
| `owner_address` | string | The account address that granted multisig permissions |
| `owner_permission` | object \| null | Owner-level permission details (null if no owner permission) |
| `active_permissions` | array | List of active permissions the queried address holds |

**`active_permissions` Item:**
| Field | Type | Description |
|---|---|---|
| `operations` | string | Hex-encoded bitmask of allowed contract types |
| `threshold` | int | Total weight required to authorize a transaction |
| `weight` | int | The queried address's weight in this permission group |


<details>
<summary><b>Response Example</b></summary>
```json
{
  "code": 0,
  "message": "OK",
  "original_message": null,
  "data": [
    {
      "owner_address": "TDqGdq76PDHrEXfEPMmNa2ayc7E4PKzfS1",
      "owner_permission": null,
      "active_permissions": [
        {
          "operations": "77ff07c002600300000000000000000000000000000000000000000000000000",
          "threshold": 66,
          "weight": 35
        },
        {
          "operations": "47ce000000000000000000000000000000000000000000000000000000000000",
          "threshold": 6,
          "weight": 2
        },
        {
          "operations": "46da000000000000000000000000000000000000000000000000000000000000",
          "threshold": 6,
          "weight": 2
        },
        {
          "operations": "121800c00220c101000000000000000000000000000000000000000000000000",
          "threshold": 10,
          "weight": 2
        },
        {
          "operations": "77ff07c0027e0302000000000000000000000000000000000000000000000000",
          "threshold": 100,
          "weight": 40
        },
        {
          "operations": "77ff07c0027e0300000000000000000000000000000000000000000000000000",
          "threshold": 8,
          "weight": 2
        }
      ]
    },
    {
      "owner_address": "TXz9dfkjui6pdegFCV1fSee96MWRwms6DB",
      "owner_permission": null,
      "active_permissions": [
        {
          "operations": "7fff1fc0033e0b00000000000000000000000000000000000000000000000000",
          "threshold": 1,
          "weight": 1
        },
        {
          "operations": "46fa01c002200100000000000000000000000000000000000000000000000000",
          "threshold": 5,
          "weight": 3
        }
      ]
    }
  ]
}
```
</details>
---

### 2. Submit Multisignature Transaction

**API Endpoint:** `POST /multi/transaction`

**Description:** Submit a signed transaction to the multisignature service. Can be used both for initial submission and for adding subsequent signatures to a pending transaction.

**Authentication:** Common request parameters are passed as **query string parameters** in the URL. See [How to Pass Authentication Parameters](#ii-how-to-pass-authentication-parameters).

**Request Body (`application/json`):**

| Field | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | The signer's TRON Base58 address (the address that produced this signature) |
| `function_selector` | string | No | The smart contract function being called (e.g., `transfer(address,uint256)`). Required for `TriggerSmartContract` type |
| `transaction` | object | Yes | The signed TRON transaction object (see below) |

**`transaction` Object:**

| Field | Type | Required | Description |
|---|---|---|---|
| `raw_data` | object | Yes | Transaction raw data containing contract details |
| `signature` | string[] | Yes | Array of hex-encoded signatures |

**`raw_data` Object:**

| Field | Type | Description |
|---|---|---|
| `ref_block_bytes` | string | Reference block bytes |
| `ref_block_hash` | string | Reference block hash |
| `expiration` | long | Transaction expiration timestamp (ms) |
| `contract` | array | Array of contract calls (typically one element) |
| `timestamp` | long | Transaction creation timestamp (ms) |
| `fee_limit` | long \| null | Maximum fee for smart contract execution (in SUN). Required for `TriggerSmartContract` |
| `data` | string | Optional memo/note |

**`contract` Item:**

| Field | Type | Description |
|---|---|---|
| `type` | string | Contract type (e.g., `TransferContract`, `TriggerSmartContract`) |
| `parameter` | object | Contract parameters containing `value` and `type_url` |
| `Permission_id` | int | The permission ID used for this transaction |

<details>
<summary><b>Request Example</b></summary>
```json
{
  "address": "TE4CeJSjLmBsXQva3F1HXvAbdAP71Q2Ucw",
  "function_selector":"transfer(address,uint256)",
  "transaction": {    
    "raw_data": {
      "ref_block_bytes": "ded4",
      "ref_block_num": null,
      "ref_block_hash": "1bb8282d1cf51fb2",
      "expiration": 1766034581308,
      "auths": null,
      "data": "",
      "contract": [
        {
          "type": "TransferContract",
          "parameter": {
            "value": {
              "amount": 12000000,
              "owner_address": "412a60357d1648251fca11576bdfea19a62ce1b45e",
              "to_address": "417e9696f656dc848478782a429c5ad421d93dde88"
            },
            "type_url": "type.googleapis.com/protocol.TransferContract"
          },
          "provider": null,
          "ContractName": null,
          "Permission_id": 8
        }
      ],
      "scripts": "",
      "timestamp": 1765948176000,
      "fee_limit": null
    },
    "signature": ["659143f51bea6f0b16ce1e5f98a662cf086eb033ce9a17fb204cdbdfa34ba75448af68e3ba746eddd53b552e70e5dbd4273b6bd649ae493361dddb28ad72b53800"]
  }
}
```

</details>

---
### 3. Pending Transaction Listener (WebSocket)

**API Endpoint:** `GET /multi/socket`

**Protocol:** WebSocket

**Description:** Establish a real-time WebSocket connection to receive pending transaction notifications for a subscribed address.

#### Connection Flow
**Step 1 — Connect with Authentication:**
Include all [Common Request Parameters](#i-common-request-parameters) (including `sign`) as query parameters in the WebSocket URL:

```
wss://apinile.walletadapter.org/multi/socket?address=TW6omSrQ1ZK37SwSvTQD5Cnp2QbEX2zDVZ&channel=AAAA&secret_id=SSSSSS&sign_version=v1&ts=174592188000&uuid=a6e4563f-1ce4-4a8f-ba37-de1cc121b4f8&sign=BASE64_ENCODED_SIGNATURE
```

**Step 2 — Subscribe:**
After the connection is established, send a subscription message specifying the address to monitor:

```json
{
  "address": "TW6omSrQ1ZK37SwSvTQD5Cnp2QbEX2zDVZ",
  "version": "v1"
}
```

The server responds with all currently pending transactions as a **JSON Array**.

**Step 3 — Receive Push Messages:**

The server pushes new pending transactions and status updates as **individual JSON Objects**. The client is responsible for determining whether a transaction is in a "pending signature" state (check `is_sign` and `state` fields).

**Step 4 — Keep-Alive:**

Send a ping message at intervals of **less than 60 seconds** to keep the connection alive:

```json
{"type": "ping"}
```

If the connection drops, the client must reconnect.

#### Push Data Fields

| Field | Type | Description |
|---|---|---|
| `hash` | string | Transaction hash |
| `contract_type` | string | Contract type (e.g., `TransferContract`, `TriggerSmartContract`) |
| `originator_address` | string | The address that initiated the transaction (`owner_address`) |
| `expire_time` | long | Transaction expiration time (0 if not set) |
| `threshold` | int | Required total signature weight |
| `current_weight` | int | Currently accumulated signature weight |
| `is_sign` | int | Whether the subscribed address has signed (`0` = unsigned, `1` = signed) |
| `signature_progress` | array | Signature status for each participant (see below) |
| `contract_data` | object | Decoded contract parameters |
| `current_transaction` | object | The current transaction object (for signing) |
| `state` | int | Transaction state (`0` = processing, `1` = success, `2` = failure) |
| `function_selector` | string | Smart contract function selector (if applicable) |

**`signature_progress` Item:**

| Field | Type | Description |
|---|---|---|
| `address` | string | Participant's TRON address |
| `weight` | int | This participant's signature weight |
| `is_sign` | int | Whether this participant has signed (`0` = no, `1` = yes) |
| `sign_time` | long | Signing timestamp in seconds (`0` if not yet signed) |


<details>
<summary><b>Push Example (JSON Array on initial subscription)</b></summary>

```json
{
    "address": "TW6omSrQ1ZK37SwSvTQD5Cnp2QbEX2zDVZ", // Subscribe to pending transactions awaiting signature; subscribe to transaction status updates.
    "version":"v1"
}
```

- **Push Example:**

```json
[
    {
        "hash": "18213ab5b1d277b4090f647b925952efe972facd19462101f3d94a58b8354c23",
        "contract_type": "TransferContract",
        "originator_address": "TQUsaH7DzTAPQEVsUvQsVyzvwqwT2p7WEm",
        "expire_time": 0,
        "threshold": 3,  
        "current_weight": 2, 
        "is_sign": 1,  
        "signature_progress": [  
            {
                "address": "TW6omSrQ1ZK37SwSvTQD5Cnp2QbEX2zDVZ",
                "weight": 1,  
                "is_sign": 0,  
                "sign_time": 0 
            },
            {
                "address": "TQUsaH7DzTAPQEVsUvQsVyzvwqwT2p7WEm",
                "weight": 1,
                "is_sign": 1,
                "sign_time": 1741858044
            },
            {
                "address": "TFdACej5gjKqSmwNNESzAbfTmBBCx55G4G",
                "weight": 1,
                "is_sign": 1,
                "sign_time": 1741858044
            }
        ],
        "contract_data": { 
            "amount": 1000000,
            "to_address": "TMf7fBmKPDGVP8b6UrEu1t6oDBRnNgwTt7",
            "owner_address": "TQUsaH7DzTAPQEVsUvQsVyzvwqwT2p7WEm"
        },
        "current_transaction": {
            "raw_data": {
                "ref_block_bytes": "3e96",
                "ref_block_num": null,
                "ref_block_hash": "6c2afde05160d139",
                "expiration": 1741944318000,
                "auths": null,
                "data": "",
                "contract": [
                    {
                        "type": "TransferContract",
                        "parameter": {
                            "value": "0a15419f2e05d49b5fe66dce55598984aace7b3dc45fb012154180358ff232c17134b914a71b346a647dad006dfe18c0843d",
                            "type_url": "type.googleapis.com/protocol.TransferContract"
                        },
                        "provider": null,
                        "ContractName": null,
                        "Permission_id": 3
                    }
                ],
                "scripts": "",
                "timestamp": 1741857918000,
                "fee_limit": null
            },
            "signature": [
                "3a53f8f5e4ed22a49a32e797d8ec9ed9dee4cd2dba8f00ee882a51bfd6691d94113a3f886f992803c191e38f59973f2b6521a7bea5235ee57eb86e3b757b4d9c1B",
                "0e586c656a95450de017c67da4b78e8639e2537873b8b8ed6a3b39bce875724f548ac0e0f3e5fe4bd6bc395b10672c51f12598bc0835ac8f673c54c8b3e4ad0f1B"
            ],
            "raw_data_hex": "0a023e9622086c2afde05160d13940b0d0e39fd9325a69080112630a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412320a15419f2e05d49b5fe66dce55598984aace7b3dc45fb012154180358ff232c17134b914a71b346a647dad006dfe18c0843d280370b098caf6d832"
        },
        "state": 1,
        "function_selector": "transfer(address,uint256)"
    }
]
```
</details>

---
### 4. Transaction List Query

**API Endpoint:** `GET /multi/list`

**Description:** Query the multisignature transaction history for a given address with pagination and filtering.

**Request Parameters (Query String):**

| Parameter | Type | Required | Description | Default |
|---|---|---|---|---|
| `address` | string | Yes | TRON Base58 address to query | — |
| `start` | int | Yes | Pagination offset (0-based). For page N with `limit` L, use `start = (N-1) * L` | — |
| `limit` | int | Yes | Number of records per page (max: 100) | — |
| `is_sign` | boolean | No | Filter by current address's signing status. `true` = signed, `false` = unsigned | `false` |
| `state` | int | Yes | Filter by transaction state. See [Transaction State](#transaction-state) | — |

> Plus all [Common Request Parameters](#i-common-request-parameters) for authentication.

**Response `data` Field:**

| Field | Type | Description |
|---|---|---|
| `total` | int | Total number of transactions matching the filter |
| `range_total` | int | Total number of transactions across all states for this address |
| `data` | array | Array of transaction objects (same structure as [WebSocket Push Data](#push-data-fields)) |


<details>
<summary><b>Response Example</b></summary>

```json
{
    "code": 0,
    "message": "OK",
    "data": {
        "total": 1,
        "range_total": 14,
        "data": [
            {
                "is_sign": 1,
                "hash": "16150b3a160f7d973bab4c74ddda7e2114b987b2552d65fb26d32efc7b32c182",
                "contract_type": "TriggerSmartContract",
                "originator_address": "TXz9dfkjui6pdegFCV1fSee96MWRwms6DB",
                "expire_time": 7782,
                "threshold": 10,
                "current_weight": 4,
                "signature_progress": [
                    {
                        "address": "TXz9dfkjui6pdegFCV1fSee96MWRwms6DB",
                        "weight": 2,
                        "is_sign": 1,
                        "sign_time": 1765968897
                    },
                    {
                        "address": "TZ4xz3c8APe7ur283wHWrkktwULDZpaYbL",
                        "weight": 2,
                        "is_sign": 0,
                        "sign_time": 0
                    },
                    {
                        "address": "TUT1qGsB9YcVAqzahoLKzvWy2hoQfaa8HY",
                        "weight": 2,
                        "is_sign": 1,
                        "sign_time": 1765968897
                    },
                    {
                        "address": "TFCSu3AF4mjRrUdqJ3aTb2s3nNr7k3yr8L",
                        "weight": 2,
                        "is_sign": 0,
                        "sign_time": 0
                    },
                    {
                        "address": "TF29U7YYSH1x99jyYvwHP1TK8BuCMnctL6",
                        "weight": 2,
                        "is_sign": 0,
                        "sign_time": 0
                    }
                ],
                "contract_data": {
                    "data": "a9059cbb0000000000000000000000007e9696f656dc848478782a429c5ad421d93dde88000000000000000000000000000000000000000000000000000000000754d4c0",
                    "owner_address": "TDqGdq76PDHrEXfEPMmNa2ayc7E4PKzfS1",
                    "contract_address": "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf"
                },
                "current_transaction": {
                    "raw_data": {
                        "ref_block_bytes": "f82c",
                        "ref_block_num": null,
                        "ref_block_hash": "e5f8a901daf17bcf",
                        "expiration": 1766054115801,
                        "auths": null,
                        "data": "",
                        "contract": [
                            {
                                "type": "TriggerSmartContract",
                                "parameter": {
                                    "value": {
                                        "data": "a9059cbb0000000000000000000000007e9696f656dc848478782a429c5ad421d93dde88000000000000000000000000000000000000000000000000000000000754d4c0",
                                        "owner_address": "412a60357d1648251fca11576bdfea19a62ce1b45e",
                                        "contract_address": "41eca9bc828a3005b9a3b909f2cc5c2a54794de05f"
                                    },
                                    "type_url": "type.googleapis.com/protocol.TriggerSmartContract"
                                },
                                "provider": null,
                                "ContractName": null,
                                "Permission_id": 8
                            }
                        ],
                        "scripts": "",
                        "timestamp": 1765967706000,
                        "fee_limit": 225000000
                    },
                    "signature": [
                        "1e7df8e74470c660525cf1a138993347da2ef51b29a0ce04884d22e92d290d8101e0b1ad9cd6b704e7e9cf7d37c7ff7c6f845d18805364bb33f86c337c7eaa7801",
                        "83d0bd7a2c032b44b7afe5ef3698fdf9b893b02d2c58847dbba0aaf7b7531113497f3cdf40165c65391398a897cd7b9792798cd26708488c52f5f7eb3193f2bd00"
                    ],
                    "raw_data_hex": ""
                },
                "state": 0,
                "function_selector": "transfer(address,uint256)"
            }
        ]
    }
}
```

</details>

---

## API Authentication Specification

### I. Common Request Parameters

All API requests must include the following common request fields, which are used for identity authentication, version identification, and request tracing:

| Name | Type | Required | Description |
|---|---|---|---|
| `sign_version` | string | Yes | API version. Currently only `v1` is supported |
| `ts` | long | Yes | Current timestamp in **milliseconds** |
| `address` | string | Yes | TRON Base58 address of the requesting account |
| `channel` | string | Yes | Project name of the requester (assigned during registration) |
| `uuid` | string | Yes | Unique request ID, randomly generated per request (UUID v4 recommended) |
| `secret_id` | string | Yes | Unique project identifier (assigned during registration) |
| `sign` | string | Yes | HMAC-SHA256 signature for request verification (see [Generation Rules](#iii-api-request-signature-generation-rules)) |

### II. How to Pass Authentication Parameters

| Request Type | How to Pass |
|---|---|
| **GET** (REST API) | All common parameters are appended as **query string** parameters |
| **POST** (REST API) | All common parameters are appended as **query string** parameters in the URL; the request body contains only business data (`Content-Type: application/json`) |
| **WebSocket** | All common parameters are appended as **query string** parameters in the WebSocket connection URL |

**Example (POST request):**

```
POST /multi/transaction?address=TMf7f...&channel=AAAA&secret_id=SSSSSS&sign_version=v1&ts=174592188000&uuid=a6e4563f-...&sign=BASE64_SIGNATURE
Content-Type: application/json

{
  "address": "TE4CeJSjLmBsXQva3F1HXvAbdAP71Q2Ucw",
  "transaction": { ... }
}
```

### III. API Request Signature Generation Rules

#### Step 1: Sort and Concatenate Parameters
   Sort all common request parameters (excluding `sign`) in ascending ASCII order by field name, then concatenate them into a `key=value` string joined by `&`.

   Example:
   ```
   address=TMf7fBmKPDGVP8b6UrEu1t6oDBRnNgwTt7&channel=AAAA&secret_id=SSSSSS&sign_version=v1&ts=174592188000&uuid=a6e4563f-1ce4-4a8f-ba37-de1cc121b4f8
   ```

#### Step 2: Construct the Signature Plaintext String 
   Format:
   ```
   {HTTP_METHOD}{Request_Path}?{Concatenated_Parameter_String}
   ```
   Example (GET request; WebSocket also uses GET):
   ```
   GET/multi/auth?address=TMf7fBmKPDGVP8b6UrEu1t6oDBRnNgwTt7&channel=AAAA&secret_id=SSSSSS&sign_version=v1&ts=174592188000&uuid=a6e4563f-1ce4-4a8f-ba37-de1cc121b4f8
   ```

> **Note:** There is no space or separator between `HTTP_METHOD` and `Request_Path`.

**Example for GET request:**

```
GET/multi/auth?address=TMf7fBmKPDGVP8b6UrEu1t6oDBRnNgwTt7&channel=AAAA&secret_id=SSSSSS&sign_version=v1&ts=174592188000&uuid=a6e4563f-1ce4-4a8f-ba37-de1cc121b4f8
```

**Example for POST request:**

```
POST/multi/transaction?address=TMf7fBmKPDGVP8b6UrEu1t6oDBRnNgwTt7&channel=AAAA&secret_id=SSSSSS&sign_version=v1&ts=174592188000&uuid=a6e4563f-1ce4-4a8f-ba37-de1cc121b4f8
```

> **Important:** The POST request body is **NOT** included in the signature calculation. Only the query string parameters participate in signing.

#### Step 3: Generate the Signature Value
1. Use the **HMAC-SHA256** algorithm with your assigned `secret_key` as the key
2. Hash the plaintext string from Step 2
3. **Base64-encode** the resulting hash to produce the final `sign` value

**Pseudocode:**

```
sign = Base64( HMAC-SHA256( secret_key, plaintext_string ) )
```

**JavaScript Example:**

```javascript
import crypto from 'crypto';

function generateSign(method, path, params, secretKey) {
  // Step 1: Sort and concatenate
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys.map(k => `${k}=${params[k]}`).join('&');

  // Step 2: Construct plaintext
  const plaintext = `${method}${path}?${queryString}`;

  // Step 3: HMAC-SHA256 + Base64
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(plaintext);
  return hmac.digest('base64');
}

// Usage
const sign = generateSign('GET', '/multi/auth', {
  address: 'TMf7fBmKPDGVP8b6UrEu1t6oDBRnNgwTt7',
  channel: 'AAAA',
  secret_id: 'SSSSSS',
  sign_version: 'v1',
  ts: '174592188000',
  uuid: 'a6e4563f-1ce4-4a8f-ba37-de1cc121b4f8'
}, 'YOUR_SECRET_KEY');
```


### IV. Key Application Process

1. Please complete the following Google Form [Google Form link](https://docs.google.com/forms/d/e/1FAIpQLSc5EB1X8JN7LA4SAVAG99VziXEY6Kv6JxmlBry9rUBlwI-GaQ/viewform?pli=1) to request your SecretID and SecretKey. 
2. Once approved, you will receive an email containing the following details:

   | Credential | Example | Description |
   |---|---|---|
   | `channel` | `AAAA` | Project name of the requester |
   | `secret_id` | `SSSSSS` | Unique project identifier |
   | `secret_key` | `CCCCCCCC` | Signature key (**must be kept secure**) |


3. **Test Credentials** (for integration testing only, subject to QPS limits):

| Field | Value |
|---|---|
| `channel` | `test` |
| `secret_id` | `TEST` |
| `secret_key` | `TESTTESTTEST` |

| Environment | Domain |
|---|---|
| Mainnet | `api.walletadapter.org` |
| Nile Testnet | `apinile.walletadapter.org` |


### V. Security Considerations

| Concern | Requirement |
|---|---|
| **Key Confidentiality** | The `secret_key` is sensitive information and must never be exposed in client-side code or public repositories |
| **Timestamp Validation** | The server validates the `ts` parameter. Allowed deviation is **within 5 minutes**. Synchronize with an NTP server if needed |
| **UUID Uniqueness** | Each request must use a unique `uuid` to prevent duplicate processing |
| **Signature Integrity** | The signature algorithm must strictly follow this specification; any deviation will cause authentication failure |

For technical support or key reset requests, please contact the official support team.

---

## Enumerations Reference

### Transaction State

| Value | Description |
|---|---|
| `0` | Processing (pending signatures) |
| `1` | Success (broadcasted to blockchain) |
| `2` | Failure |
| `255` | All (used only as a query filter in `/multi/list`) |

### Signature Status (`is_sign`)

| Value | Description |
|---|---|
| `0` | Not yet signed |
| `1` | Signed |

---

## Security Warning

⚠️ **Important:** This demo exposes secret keys in browser code. **Use for development/testing only.**  
In production, always use a backend service to handle API calls and keep secrets secure.

---

## License

tron multi sig is distributed under a MIT licence.
