/**
 * Node.js WebSocket Listening Example
 * Demonstrates how to listen for pending transactions in real-time
 */

import 'dotenv/config';
import { MultiSigClient, TransactionDetail } from '../../src';

async function main() {
  // 1. Initialize client
  const client = new MultiSigClient({
    baseURL: process.env.BASE_URL!,
    secretId: process.env.SECRET_ID!,
    secretKey: process.env.SECRET_KEY!,
    channel: process.env.CHANNEL!
  });

  const testAddress = process.env.TEST_ADDRESS!;

  console.log('=== TRON Multi-Signature Transaction Real-Time Monitoring ===');
  console.log('Monitoring address:', testAddress);
  console.log('Establishing connection...\n');

  try {
    // 2. Establish WebSocket connection
    await client.connectWebSocket(testAddress);

    // 3. Listen for pending transactions
    client.onPendingTransaction((transactions: TransactionDetail | TransactionDetail[]) => {
      if (!Array.isArray(transactions)) {
        transactions = [transactions];
      }

      console.log(`\nReceived ${transactions.length} transaction updates:`);
      console.log('='.repeat(60));

      transactions.forEach((tx, index) => {
        console.log(`\n[Transaction ${index + 1}]`);
        console.log('  Hash:', tx.hash);
        console.log('  Type:', tx.contract_type);
        console.log('  Originator address:', tx.originator_address);
        console.log('  Threshold/Current weight:', `${tx.current_weight}/${tx.threshold}`);
        console.log('  Signed:', tx.is_sign === 1 ? 'Yes' : 'No');
        console.log('  State:', getStateText(tx.state));

        // Display signature progress
        console.log('  Signature progress:');
        tx.signature_progress.forEach(signer => {
          const status = signer.is_sign === 1 ? '✓ Signed' : '○ Pending';
          const time = signer.sign_time > 0 ? new Date(signer.sign_time * 1000).toLocaleString() : '-';
          console.log(`    ${status} ${signer.address} (weight: ${signer.weight}, time: ${time})`);
        });

        // Display contract data
        if (tx.contract_data && Object.keys(tx.contract_data).length > 0) {
          console.log('  Contract data:', JSON.stringify(tx.contract_data, null, 4));
        }
      });

      console.log('\n' + '='.repeat(60));
    });

    // Keep connection alive
    console.log('WebSocket connection successful! Waiting for transaction pushes...');
    console.log('Press Ctrl+C to exit\n');

    // Graceful exit
    process.on('SIGINT', () => {
      console.log('\n\nClosing connection...');
      client.disconnect();
      process.exit(0);
    });

  } catch (error: any) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Get state text
 */
function getStateText(state: number): string {
  switch (state) {
    case 0:
      return 'Processing';
    case 1:
      return 'Success';
    case 2:
      return 'Failed';
    default:
      return `Unknown(${state})`;
  }
}

// Run example
main().catch(console.error);
