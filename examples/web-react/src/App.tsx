import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfigSection from './components/ConfigSection';
import ActionButtons from './components/ActionButtons';
import ResultDisplay from './components/ResultDisplay';
import WebSocketLog from './components/WebSocketLog';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useMultiSigClient, ClientConfig } from './hooks/useMultiSigClient';

export default function App() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<ClientConfig>({
    baseURL: 'https://apinile.walletadapter.org',
    secretId: '',
    secretKey: '',
    channel: '',
    testAddress: ''
  });

  const {
    queryAuth,
    queryTransactionList,
    connectWebSocket,
    disconnectWebSocket,
    results,
    wsLogs,
    isConnected,
    clearResults,
    clearWSLogs
  } = useMultiSigClient();

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>{t('app.title')}</h1>
          <p>{t('app.subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="container">
        <ConfigSection config={config} onChange={setConfig} />

        <ActionButtons
          onQueryAuth={() => queryAuth(config)}
          onQueryTransactionList={() => queryTransactionList(config)}
          onConnectWS={() => connectWebSocket(config)}
          onDisconnectWS={disconnectWebSocket}
          isConnected={isConnected}
        />

        <ResultDisplay results={results} onClear={clearResults} />

        <WebSocketLog logs={wsLogs} onClear={clearWSLogs} />
      </div>
    </div>
  );
}
