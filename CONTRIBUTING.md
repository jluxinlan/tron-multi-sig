# TRON Multi-Signature Service Demo

**This is a demo implementation, not a production-ready SDK.** It demonstrates how to integrate with TRON multi-signature service in both Node.js and browser environments.

**Important**: Developers should use this as a reference to build their own SDK according to their specific needs and security requirements.

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Core Functions & Usage](#core-functions--usage)
- [Security Warning](#security-warning)
- [License](#license)

---

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```env
BASE_URL=https://niletest.tronlink.org
SECRET_ID=your-secret-id-here
SECRET_KEY=your-secret-key-here
CHANNEL=your-channel
TEST_ADDRESS=TYourTestAddressHere
```

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
- Submit multi-signature transactions
- View transaction lists
- WebSocket real-time monitoring

---

## Features

- Query multi-signature permissions for an address
- Submit multi-signature transactions
- Query transaction lists
- Real-time monitoring of pending transactions via WebSocket

---

## Core Functions & Usage

Below are the main functions provided by the demo, with detailed parameter descriptions and usage examples.

### 1. Initialize the Client

```ts
import { MultiSigClient } from './src/services/MultiSigClient';

const client = new MultiSigClient({
  baseUrl: process.env.BASE_URL,      // string: API base URL
  secretId: process.env.SECRET_ID,    // string: Your secret ID
  secretKey: process.env.SECRET_KEY,  // string: Your secret key
  channel: process.env.CHANNEL,       // string: Channel identifier
});
```

### 2. Query Address Permissions

```ts
/**
 * Get multi-signature permissions for an address.
 * @param address {string} - The TRON address to query.
 * @returns {Promise<PermissionInfo>} - Permission details.
 */
const permissions = await client.getAddressPermission(process.env.TEST_ADDRESS);
console.log('Permission Info:', permissions);
```

### 3. Submit Multi-Signature Transaction

```ts
/**
 * Submit a multi-signature transaction.
 * @param params {object} - Transaction parameters:
 *   - from {string}: Sender address
 *   - to {string}: Recipient address
 *   - amount {number}: Amount in SUN (1 TRX = 1,000,000 SUN)
 *   - memo? {string}: (Optional) Transaction memo
 *   - ...otherParams: (Optional) Additional parameters as needed
 * @returns {Promise<TransactionResult>} - Submission result
 */
const txResult = await client.submitTransaction({
  from: process.env.TEST_ADDRESS,
  to: 'Txxxxxxx',      // Recipient address
  amount: 1000000,     // Amount in SUN
  memo: 'Test transfer'
});
console.log('Transaction Result:', txResult);
```

### 4. Query Transaction List

```ts
/**
 * Get a list of multi-signature transactions.
 * @param address {string} - The address to query.
 * @param options {object} - Query options:
 *   - limit? {number}: Number of records to return (default: 10)
 *   - offset? {number}: Offset for pagination (default: 0)
 *   - status? {string}: Filter by status (e.g., 'pending', 'completed')
 * @returns {Promise<TransactionList>} - List of transactions
 */
const txList = await client.getTransactionList(process.env.TEST_ADDRESS, { limit: 10 });
console.log('Transaction List:', txList);
```

### 5. WebSocket Real-Time Monitoring

```ts
/**
 * Create a WebSocket connection to monitor pending transactions.
 * @param address {string} - The address to monitor.
 * @returns {WebSocket} - WebSocket instance
 */
const ws = client.createWebSocket(process.env.TEST_ADDRESS);

ws.on('pending', (tx) => {
  console.log('Pending Transaction:', tx);
});

ws.on('error', (err) => {
  console.error('WebSocket Error:', err);
});
```

> For more details, see [`examples/node/basic-usage.ts`](examples/node/basic-usage.ts) and [`examples/node/websocket-demo.ts`](examples/node/websocket-demo.ts).

---

## Security Warning

⚠️ **Important**: This demo exposes secret keys in browser code. **Use for development/testing only.** In production, always use a backend service to handle API calls and keep secrets secure.

---

## License

Apache License 2.0