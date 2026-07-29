import { getLocales } from 'react-native-localize';

export type AppLanguage = 'KO' | 'EN' | 'ZH' | 'JA' | 'VI';

export function getDeviceLanguage(): AppLanguage {
  const locale = (getLocales()[0]?.languageCode ?? 'ko').toLowerCase();

  if (locale === 'ko') return 'KO';
  if (locale === 'en') return 'EN';
  if (locale === 'zh') return 'ZH';
  if (locale === 'ja') return 'JA';
  if (locale === 'vi') return 'VI';

  return 'KO';
}
