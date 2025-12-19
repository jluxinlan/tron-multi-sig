import { useTranslation } from 'react-i18next';
import { ClientConfig } from '../hooks/useMultiSigClient';

interface ConfigSectionProps {
  config: ClientConfig;
  onChange: (config: ClientConfig) => void;
}

export default function ConfigSection({ config, onChange }: ConfigSectionProps) {
  const { t } = useTranslation();

  const handleChange = (field: keyof ClientConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="config-section">
      <h2>{t('config.title')}</h2>

      <div className="form-group">
        <label>{t('config.apiUrl')}</label>
        <input
          type="text"
          value={config.baseURL}
          onChange={(e) => handleChange('baseURL', e.target.value)}
          placeholder={t('config.placeholders.apiUrl')}
        />
      </div>

      <div className="form-group">
        <label>{t('config.secretId')}</label>
        <input
          type="text"
          value={config.secretId}
          onChange={(e) => handleChange('secretId', e.target.value)}
          placeholder={t('config.placeholders.secretId')}
        />
      </div>

      <div className="form-group">
        <label>{t('config.secretKey')}</label>
        <input
          type="password"
          value={config.secretKey}
          onChange={(e) => handleChange('secretKey', e.target.value)}
          placeholder={t('config.placeholders.secretKey')}
        />
      </div>

      <div className="form-group">
        <label>{t('config.channel')}</label>
        <input
          type="text"
          value={config.channel}
          onChange={(e) => handleChange('channel', e.target.value)}
          placeholder={t('config.placeholders.channel')}
        />
      </div>

      <div className="form-group">
        <label>{t('config.testAddress')}</label>
        <input
          type="text"
          value={config.testAddress}
          onChange={(e) => handleChange('testAddress', e.target.value)}
          placeholder={t('config.placeholders.testAddress')}
        />
      </div>
    </div>
  );
}
