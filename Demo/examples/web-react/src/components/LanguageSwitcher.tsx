import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLanguage = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <button className="language-switcher" onClick={toggleLanguage}>
      {i18n.language === 'zh-CN' ? 'English' : 'Chinese'}
    </button>
  );
}
