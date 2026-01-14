'use client';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'nl' : 'en')}
      className="w-12 font-bold"
    >
      {language.toUpperCase()}
    </Button>
  );
}
