import { useTranslation } from 'react-i18next';

interface ActionButtonsProps {
  onQueryAuth: () => void;
  onQueryTransactionList: () => void;
  onConnectWS: () => void;
  onDisconnectWS: () => void;
  isConnected: boolean;
}

export default function ActionButtons({
  onQueryAuth,
  onQueryTransactionList,
  onConnectWS,
  onDisconnectWS,
  isConnected
}: ActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className="action-buttons">
      <button className="btn btn-primary" onClick={onQueryAuth}>
        {t('actions.queryAuth')}
      </button>
      <button className="btn btn-primary" onClick={onQueryTransactionList}>
        {t('actions.queryTransactions')}
      </button>
      <button
        className="btn btn-success"
        onClick={onConnectWS}
        disabled={isConnected}
      >
        {t('actions.connectWebSocket')}
      </button>
      <button
        className="btn btn-danger"
        onClick={onDisconnectWS}
        disabled={!isConnected}
      >
        {t('actions.disconnect')}
      </button>
    </div>
  );
}
