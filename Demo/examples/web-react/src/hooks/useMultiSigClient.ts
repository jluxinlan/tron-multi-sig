import { useRef, useState, useCallback } from 'react';
import { MultiSigClient, TransactionDetail } from 'tron-multisig-demo';

export interface ClientConfig {
  baseURL: string;
  secretId: string;
  secretKey: string;
  channel: string;
  testAddress: string;
}

export interface Result {
  title: string;
  data: any;
  success: boolean;
  timestamp: Date;
}

export function useMultiSigClient() {
  const clientRef = useRef<MultiSigClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [wsLogs, setWsLogs] = useState<string[]>([]);

  const initClient = useCallback((config: ClientConfig) => {
    clientRef.current = new MultiSigClient({
      baseURL: config.baseURL,
      secretId: config.secretId,
      secretKey: config.secretKey,
      channel: config.channel
    });
  }, []);

  const addResult = useCallback((title: string, data: any, success: boolean) => {
    setResults(prev => [{
      title,
      data,
      success,
      timestamp: new Date()
    }, ...prev]);
  }, []);

  const addWSLog = useCallback((message: string) => {
    setWsLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  const clearWSLogs = useCallback(() => {
    setWsLogs([]);
  }, []);

  const queryAuth = useCallback(async (config: ClientConfig) => {
    initClient(config);
    try {
      const result = await clientRef.current!.queryAuth(config.testAddress);
      addResult('Query Permissions', result, true);
    } catch (error: any) {
      addResult('Query Permissions Failed', { error: error.message }, false);
    }
  }, [initClient, addResult]);

  const queryTransactionList = useCallback(async (config: ClientConfig) => {
    initClient(config);
    try {
      const result = await clientRef.current!.queryTransactionList({
        address: config.testAddress,
        start: 0,
        limit: 10,
        state: 255
      });
      addResult('Transaction List', result, true);
    } catch (error: any) {
      addResult('Query Transaction List Failed', { error: error.message }, false);
    }
  }, [initClient, addResult]);

  const connectWebSocket = useCallback(async (config: ClientConfig) => {
    if (isConnected) {
      addWSLog('WebSocket already connected, please disconnect first');
      return;
    }

    initClient(config);
    try {
      addWSLog('Connecting to WebSocket...');

      await clientRef.current!.connectWebSocket(config.testAddress);

      clientRef.current!.onPendingTransaction((transactions: TransactionDetail | TransactionDetail[]) => {
        const txList = Array.isArray(transactions) ? transactions : [transactions];
        addWSLog(`Received ${txList.length} transaction updates`);
        addWSLog(JSON.stringify(txList, null, 2));
      });

      setIsConnected(true);
      addWSLog('✓ WebSocket connection successful!');
    } catch (error: any) {
      addWSLog('✗ Connection failed: ' + error.message);
    }
  }, [isConnected, initClient, addWSLog]);

  const disconnectWebSocket = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setIsConnected(false);
      addWSLog('Manually disconnected');
    } else {
      addWSLog('WebSocket not connected');
    }
  }, [addWSLog]);

  return {
    queryAuth,
    queryTransactionList,
    connectWebSocket,
    disconnectWebSocket,
    results,
    wsLogs,
    isConnected,
    clearResults,
    clearWSLogs
  };
}
