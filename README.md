# Developer Guide: Integrating TRON Multisig Service for Wallets

## Table of Contents

- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Features](#features)
- [Core Functions & Usage](#core-functions--usage)
- [Multisignature Transaction Flow](#multisignature-transaction-flow)
- [API List](#api-list)
- [API Authentication Specification](#api-authentication-specification)
- [Security Warning](#security-warning)
- [License](#license)

---

## Project Overview

This project demonstrates how to integrate with the TRON multisignature service, including basic API usage and WebSocket real-time monitoring, in both Node.js and browser (React) environments.

The TRON Multi-Signature Service is an application-layer multi-signature transaction service designed to manage permission verification, signature workflows, and execution control for multi-signature transactions without accessing private keys.

Developers can submit a pending on-chain transaction through this service. Based on the pre-configured multi-signature permission rules of the account, the service collects and validates signatures from multiple participants and advances the multi-signature workflow asynchronously. Once the accumulated signature weight meets the threshold defined by the on-chain account, the system automatically broadcasts the transaction to the blockchain and completes its execution.

The TRON Multi-Signature Service does not custody, generate, or use private keys. It is positioned as a keyless multi-signature transaction orchestration hub.

---
> **This is a demo implementation, not a production-ready SDK.**  
> It demonstrates how to integrate with the TRON multisignature service in both Node.js and browser environments.  
> **Important:** Use this as a reference only. For production, always keep your secrets on the backend.

---

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
BASE_URL in Test Environment: https://apinile.walletadapter.org

BASE_URL in Online Environment: https://api.walletadapter.org


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

### I. Constructing a Multisignature Transaction and Submitting It to the Service

1. **Query Multisignature Authorization Details for the Current Address**  
   Call the `/multi/auth` endpoint to retrieve all addresses over which the specified address has multisignature permissions. This step is intended to verify whether the current address has been properly authorized by the transaction initiator (i.e., the `owner_address`).

2. **Construct and Sign the Transaction**  
   Based on business requirements, construct a transaction object (`Transaction`) using the `owner_address`, and then sign the transaction with the current address.

3. **Submit the Transaction**  
   Call the `/multi/transaction` endpoint to submit the transaction to the multisignature service for subsequent processing.

### II. Query Pending Transactions, Sign, and Submit

1. **Query Pending Transactions**  
   Establish a WebSocket connection via `/multi/socket` to listen in real time for pending signing tasks associated with the current address. This interface supports active message push, ensuring users are notified immediately of transactions requiring action.

2. **Sign and Submit the Transaction**  
   After signing, submit the transaction object again through `/multi/transaction`. The multisignature service automatically verifies signature validity and weight, and broadcasts the transaction once the threshold is met. Developers can track transaction progress using the returned transaction hash.

---

## API List

> **All APIs require authentication. Refer to [API Authentication Specification](#api-authentication-specification) for authentication details.**

### 1. Query Multisignature Authorization Details

- **API Name:** Address Permission Query
- **API Endpoint:** `GET /multi/auth`
- **Request Parameters:**

| Parameter | Type   | Required | Description                                 | Example                          |
|-----------|--------|----------|---------------------------------------------|----------------------------------|
| address   | string | Yes      | Current address (query addresses it controls) | TXz9dfkjui6pdegFCV1fSee96MWRwms6DB |

- **Response Example:**

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

### 2. Construct and Submit a Multisignature Transaction

- **API Name:** Multisignature Transaction Submission
- **API Endpoint:** `POST /multi/transaction`
- **Request Body Example:**

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


### 3. Pending Transaction Listener (WebSocket)

- **API Name:** Real-Time Pending Transaction Listener
- **API Endpoint:** `GET /multi/socket`
- **Protocol:** WebSocket

- **Connection Flow:**
  1. Authentication: The client includes valid authentication parameters in the HTTP request URL.(The format is specified by the server and you can refer to [[API Authentication Specification]](#api-authentication-specification) for details)
  2. Connection establishment: After validation, the client sends the current operating address for subscribe. The server will then return all pending transactions associated with that subscription address. The data structure for this message is a jsonArray.
  3. Data exchange: The server will push new pending transactions and transaction status updates related to the subscribed address for the client to sign. The data structure for these pushed messages is a jsonObj. The front end is responsible for determining whether a transaction is in a "pending signature" state.
  4. Connection Maintenance (Keep-Alive): To keep the connection active, the client must send a ping message: {"type": "ping"}. The interval between pings must be less than 60 seconds. If the connection is dropped, a reconnection is required.

- **Response Example:**

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

### 4. Transaction List Query

- **API Name:** Multisignature Transaction History Query
- **API Endpoint:** `GET /multi/list`
- **Request Parameters:**

| Parameter | Type    | Required | Description                                                                    |
|-----------|---------|----------|--------------------------------------------------------------------------------|
| address   | string  | Yes      | Current address                                                                |
| start     | int     | Yes      | Pagination start index (if limit=10, then start=10 for Page 2 )                          |
| limit     | int     | Yes      | Pagination limit (max 100)                                                     |
| is_sign   | boolean | No       | Filter by signed transactions of current address (true = signed; false = unsigned, default false)       |
| state     | int     | Yes      | Filter by transaction status (0 = processing; 1 = success; 2 = failure; 255 = all) |

- **Response Example:**

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

---

## API Authentication Specification

### I. Common Request Parameters

All API requests must include the following common request fields, which are used for identity authentication, version identification, and request tracing:

| Name        | Type   | Description                                                        |
|-------------|--------|--------------------------------------------------------------------|
| sign_version| string | v1, currently only v1 is supported                                 |
| ts          | long   | Current timestamp in milliseconds                                  |
| address     | string | TRON Base58 address representing the requesting account            |
| channel     | string | Project name of the requester (defined during application)         |
| uuid        | string | Unique request ID, randomly generated per request                  |
| secret_id   | string | Unique project identifier agreed with the multisignature service   |
| sign        | string | API signature used by the multisignature service to verify request |

### II. API Request Signature (`sign`) Generation Rules

1. **Signature Parameter Ordering**  
   Sort all common request parameters (excluding `sign`) in ascending ASCII order by field name, then concatenate them into a `key=value` string joined by `&`.

   Example:
   ```
   address=TMf7fBmKPDGVP8b6UrEu1t6oDBRnNgwTt7&channel=AAAA&secret_id=SSSSSS&sign_version=v1&ts=174592188000&uuid=a6e4563f-1ce4-4a8f-ba37-de1cc121b4f8
   ```

2. **Construct the Signature Plaintext String**  
   Format:
   ```
   HTTP_METHOD + Request_Path + ? + Concatenated_Parameter_String
   ```
   Example (GET request; WebSocket also uses GET):
   ```
   GET/multi/auth?address=TMf7fBmKPDGVP8b6UrEu1t6oDBRnNgwTt7&channel=AAAA&secret_id=SSSSSS&sign_version=v1&ts=174592188000&uuid=a6e4563f-1ce4-4a8f-ba37-de1cc121b4f8
   ```

3. **Generate the Signature Value**  
   - Use the **HmacSHA256** algorithm, with the project’s assigned `secret_key` as the encryption key, to hash the signature plaintext string.
   - Encode the resulting hash using **Base64** to obtain the final `sign` parameter value.

### III. Key (`secret_id` / `secret_key`) Application Process

- Please complete the following Google Form [Google Form link](https://docs.google.com/forms/d/e/1FAIpQLSc5EB1X8JN7LA4SAVAG99VziXEY6Kv6JxmlBry9rUBlwI-GaQ/viewform?pli=1) to request your SecretID and SecretKey. 
- Once approved, you will receive an email containing the following details:

```
channel: AAAA (project name of the requester)
secret_id: SSSSSS (unique project identifier)
secret_key: CCCCCCCC (signature key, must be kept secure)
```

- To facilitate integration testing for teams, a set of test credentials is provided. Please note that these credentials are subject to QPS limits and must not be used for high-frequency requests.
```
channel: test
secret_id: TEST
secret_key: TESTTESTTEST
```

- Mainnet Domain: api.walletadapter.org
- Nile Testnet Domain:  apinile.walletadapter.org


### IV. Security Considerations

1. **Key Confidentiality:** The `secretKey` is sensitive information and must be strictly protected to prevent leakage.
2. **Timestamp Validation:** The server validates the request timestamp `ts`. It is recommended that clients synchronize time with an NTP server. The allowed time deviation must be within 5 minutes.
3. **UUID Uniqueness:** Each request must generate a unique `uuid` to avoid business exceptions caused by duplicate requests.
4. **Signature Integrity:** Ensure that the signature algorithm implementation strictly follows this specification; otherwise, authentication will fail.

For technical support or key reset requests, please contact the official support team.

---

## Security Warning

⚠️ **Important:** This demo exposes secret keys in browser code. **Use for development/testing only.**  
In production, always use a backend service to handle API calls and keep secrets secure.

---

## License

tron multi sig is distributed under a MIT licence.
