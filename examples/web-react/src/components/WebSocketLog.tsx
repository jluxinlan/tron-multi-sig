import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface WebSocketLogProps {
  logs: string[];
  onClear: () => void;
}

export default function WebSocketLog({ logs, onClear }: WebSocketLogProps) {
  const { t } = useTranslation();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="result-box">
      <div className="section-header">
        <h4>{t('websocket.title')}</h4>
        <button className="btn btn-sm" onClick={onClear}>{t('common.clear')}</button>
      </div>
      <div className="ws-log" ref={logRef}>
        {logs.map((log, index) => (
          <div key={index} className="ws-log-item">{log}</div>
        ))}
      </div>
    </div>
  );
}
