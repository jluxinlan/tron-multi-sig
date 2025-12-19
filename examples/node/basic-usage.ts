/**
 * Node.js Basic Usage Example
 * Demonstrates how to call multi-signature service API
 */

import 'dotenv/config';
import { MultiSigClient } from '../../src';

async function main() {
  // 1. Initialize client
  const client = new MultiSigClient({
    baseURL: process.env.BASE_URL!,
    secretId: process.env.SECRET_ID!,
    secretKey: process.env.SECRET_KEY!,
    channel: process.env.CHANNEL!
  });

  const testAddress = process.env.TEST_ADDRESS!;

  try {
    // 2. Query address permissions
    console.log('\n=== 1. Query Address Permissions ===');
    const authResult = await client.queryAuth(testAddress);
    console.log('Permission query result:', JSON.stringify(authResult, null, 2));

    // 3. Query transaction list
    console.log('\n=== 2. Query Transaction List ===');
    const listResult = await client.queryTransactionList({
      address: testAddress,
      start: 0,
      limit: 10,
      state: 255 // Query all states
    });
    console.log('Total transactions:', listResult.data.total);
    console.log('Current page count:', listResult.data.data.length);

    if (listResult.data.data.length > 0) {
      console.log('\nFirst transaction details:');
      const firstTx = listResult.data.data[0];
      console.log('  Hash:', firstTx.hash);
      console.log('  Type:', firstTx.contract_type);
      console.log('  Originator address:', firstTx.originator_address);
      console.log('  Threshold:', firstTx.threshold);
      console.log('  Current weight:', firstTx.current_weight);
      console.log('  State:', firstTx.state);
    }

    // 4. Submit transaction example (requires actual transaction data)
    console.log('\n=== 3. Submit Transaction Example ===');
    console.log('Submitting a transaction requires real transaction data. Here is just an example call:');
    console.log(`
const submitResult = await client.submitTransaction({
  address: 'TReplaceOwnerAddressHere....',
  function_selector: 'transfer(address,uint256)',
  transaction: {
    raw_data: {
      // ... transaction raw data
    },
    signature: ['signature data']
  }
});
    `);
  } catch (error: any) {
    console.error('Request failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run example
main().catch(console.error);
