import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  KO: {
    translation: {
      tabs: {
        home: '홈',
        map: '지도',
        manual: '메뉴얼',
        more: '더보기',
      },
      home: {
        messageTitle2: '일일 재난안전관리 상황',
      },
    },
  },
  EN: {
    translation: {
      tabs: {
        home: 'Home',
        map: 'Map',
        manual: 'Manual',
        more: 'More',
      },
      home: {
        messageTitle2: 'Daily Disaster Safety Status',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'KO',
  fallbackLng: 'KO',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
