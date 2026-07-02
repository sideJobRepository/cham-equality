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
      map: {
        labels: {
          nearbyLocation: '내 위치 주변 보기',
          shelter: '대피소',
          totalShelters: '총 대피소',
        },
        filters: {
          shelterAll: '전체',
          civilDefense: '민방위대피시설',
          earthquake: '지진대피장소',
          chemicalAccident: '화학사고대피장소',
          earthquakeTemporaryHousing: '지진겸용 임시주거시설',
          disasterTemporaryHousing: '이재민 임시주거시설',
          accessibilityAll: '접근성 전체',
          ramp: '경사로',
          elevator: '엘리베이터',
          brailleBlock: '점자블록',
          accessibleToilet: '장애인 화장실',
        },
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
      map: {
        labels: {
          nearbyLocation: 'Near My Location',
          shelter: 'Shelters',
          totalShelters: 'Total Shelters',
        },
        filters: {
          shelterAll: 'All',
          civilDefense: 'Civil Defense',
          earthquake: 'Earthquake',
          chemicalAccident: 'Chemical Accident',
          earthquakeTemporaryHousing: 'Earthquake Temporary Housing',
          disasterTemporaryHousing: 'Disaster Temporary Housing',
          accessibilityAll: 'All Accessibility',
          ramp: 'Ramp',
          elevator: 'Elevator',
          brailleBlock: 'Braille Block',
          accessibleToilet: 'Accessible Toilet',
        },
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
