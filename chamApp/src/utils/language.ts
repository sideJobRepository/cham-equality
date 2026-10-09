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

// 언어 이름은 그 언어를 쓰는 사람이 알아봐야 하므로 번역하지 않고 원어 그대로 둔다.
// locale 은 스크린리더가 원어명을 해당 언어 발음으로 읽게 하는 accessibilityLanguage 값.
export const LANGUAGE_OPTIONS: ReadonlyArray<{
  code: AppLanguage;
  label: string;
  locale: string;
}> = [
  { code: 'KO', label: '한국어', locale: 'ko-KR' },
  { code: 'EN', label: 'English', locale: 'en-US' },
  { code: 'ZH', label: '中文', locale: 'zh-CN' },
  { code: 'JA', label: '日本語', locale: 'ja-JP' },
  { code: 'VI', label: 'Tiếng Việt', locale: 'vi-VN' },
];
