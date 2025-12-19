import { useTranslation } from 'react-i18next';
import { Result } from '../hooks/useMultiSigClient';

interface ResultDisplayProps {
  results: Result[];
  onClear: () => void;
}

export default function ResultDisplay({ results, onClear }: ResultDisplayProps) {
  const { t } = useTranslation();

  if (results.length === 0) return null;

  return (
    <div className="result-section">
      <div className="section-header">
        <h3>{t('results.title')}</h3>
        <button className="btn btn-sm" onClick={onClear}>{t('common.clear')}</button>
      </div>

      {results.map((result, index) => (
        <div key={index} className="result-box">
          <h4>
            {result.title}
            <span className={`status ${result.success ? 'status-success' : 'status-error'}`}>
              {result.success ? t('common.success') : t('common.failed')}
            </span>
          </h4>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
