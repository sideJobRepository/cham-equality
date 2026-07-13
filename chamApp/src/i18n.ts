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
      manual: {
        title: '재난 행동요령',
        no: 'No',
        subject: '제목',
        createdAt: '작성일',
        empty: '등록된 행동요령이 없습니다.',
      },
      auth: {
        loginTitle: '로그인하고 제보를 시작하세요',
        kakao: '카카오로 로그인',
        apple: 'Apple로 로그인',
        logout: '로그아웃',
        greeting: '{{name}}님 환영합니다',
      },
      map: {
        labels: {
          nearbyLocation: '내 위치 주변 보기',
          shelter: '대피소',
          totalShelters: '총 대피소',
        },
        location: {
          checking: '현재 위치 확인 중',
          addressChecking: '현재 위치 주소 확인 중',
          permissionRequired: '위치 권한이 필요합니다',
          unavailable: '현재 위치를 확인할 수 없습니다',
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
      manual: {
        title: 'Disaster Safety Guide',
        no: 'No',
        subject: 'Title',
        createdAt: 'Date',
        empty: 'No safety guides are available.',
      },
      auth: {
        loginTitle: 'Log in to start reporting',
        kakao: 'Log in with Kakao',
        apple: 'Sign in with Apple',
        logout: 'Log out',
        greeting: 'Welcome, {{name}}',
      },
      map: {
        labels: {
          nearbyLocation: 'Near My Location',
          shelter: 'Shelters',
          totalShelters: 'Total Shelters',
        },
        location: {
          checking: 'Checking current location',
          addressChecking: 'Checking current address',
          permissionRequired: 'Location permission is required',
          unavailable: 'Current location is unavailable',
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
  ZH: {
    translation: {
      tabs: {
        home: '首页',
        map: '地图',
        manual: '指南',
        more: '更多',
      },
      home: {
        messageTitle2: '每日灾害安全管理情况',
      },
      manual: {
        title: '灾害行动指南',
        no: '编号',
        subject: '标题',
        createdAt: '日期',
        empty: '暂无行动指南。',
      },
      auth: {
        loginTitle: '登录后开始举报',
        kakao: '使用 Kakao 登录',
        apple: '使用 Apple 登录',
        logout: '退出登录',
        greeting: '欢迎，{{name}}',
      },
      map: {
        labels: {
          nearbyLocation: '查看我的位置附近',
          shelter: '避难所',
          totalShelters: '避难所总数',
        },
        location: {
          checking: '正在确认当前位置',
          addressChecking: '正在确认当前位置地址',
          permissionRequired: '需要位置权限',
          unavailable: '无法确认当前位置',
        },
        filters: {
          shelterAll: '全部',
          civilDefense: '民防避难设施',
          earthquake: '地震避难场所',
          chemicalAccident: '化学事故避难场所',
          earthquakeTemporaryHousing: '地震临时居住设施',
          disasterTemporaryHousing: '灾民临时居住设施',
          accessibilityAll: '无障碍全部',
          ramp: '坡道',
          elevator: '电梯',
          brailleBlock: '盲道',
          accessibleToilet: '无障碍卫生间',
        },
      },
    },
  },
  JA: {
    translation: {
      tabs: {
        home: 'ホーム',
        map: '地図',
        manual: 'マニュアル',
        more: 'その他',
      },
      home: {
        messageTitle2: '日次災害安全管理状況',
      },
      manual: {
        title: '災害時行動ガイド',
        no: 'No',
        subject: 'タイトル',
        createdAt: '作成日',
        empty: '登録された行動ガイドはありません。',
      },
      auth: {
        loginTitle: 'ログインして提報を始める',
        kakao: 'カカオでログイン',
        apple: 'Appleでログイン',
        logout: 'ログアウト',
        greeting: '{{name}}さん、ようこそ',
      },
      map: {
        labels: {
          nearbyLocation: '現在地周辺を見る',
          shelter: '避難所',
          totalShelters: '避難所合計',
        },
        location: {
          checking: '現在地を確認中',
          addressChecking: '現在地の住所を確認中',
          permissionRequired: '位置情報の許可が必要です',
          unavailable: '現在地を確認できません',
        },
        filters: {
          shelterAll: 'すべて',
          civilDefense: '民防避難施設',
          earthquake: '地震避難場所',
          chemicalAccident: '化学事故避難場所',
          earthquakeTemporaryHousing: '地震対応臨時住宅',
          disasterTemporaryHousing: '被災者臨時住宅',
          accessibilityAll: 'アクセシビリティすべて',
          ramp: 'スロープ',
          elevator: 'エレベーター',
          brailleBlock: '点字ブロック',
          accessibleToilet: 'バリアフリートイレ',
        },
      },
    },
  },
  VI: {
    translation: {
      tabs: {
        home: 'Trang chủ',
        map: 'Bản đồ',
        manual: 'Hướng dẫn',
        more: 'Thêm',
      },
      home: {
        messageTitle2: 'Tình hình quản lý an toàn thiên tai hằng ngày',
      },
      manual: {
        title: 'Hướng dẫn ứng phó thiên tai',
        no: 'STT',
        subject: 'Tiêu đề',
        createdAt: 'Ngày tạo',
        empty: 'Chưa có hướng dẫn nào.',
      },
      auth: {
        loginTitle: 'Đăng nhập để bắt đầu báo cáo',
        kakao: 'Đăng nhập bằng Kakao',
        apple: 'Đăng nhập bằng Apple',
        logout: 'Đăng xuất',
        greeting: 'Xin chào, {{name}}',
      },
      map: {
        labels: {
          nearbyLocation: 'Xem gần vị trí của tôi',
          shelter: 'Nơi trú ẩn',
          totalShelters: 'Tổng nơi trú ẩn',
        },
        location: {
          checking: 'Đang kiểm tra vị trí hiện tại',
          addressChecking: 'Đang kiểm tra địa chỉ hiện tại',
          permissionRequired: 'Cần quyền truy cập vị trí',
          unavailable: 'Không thể xác định vị trí hiện tại',
        },
        filters: {
          shelterAll: 'Tất cả',
          civilDefense: 'Cơ sở trú ẩn dân phòng',
          earthquake: 'Nơi trú ẩn động đất',
          chemicalAccident: 'Nơi trú ẩn sự cố hóa chất',
          earthquakeTemporaryHousing: 'Nhà tạm dùng khi động đất',
          disasterTemporaryHousing: 'Nhà tạm cho nạn nhân thiên tai',
          accessibilityAll: 'Tất cả hỗ trợ tiếp cận',
          ramp: 'Đường dốc',
          elevator: 'Thang máy',
          brailleBlock: 'Gạch chỉ dẫn nổi',
          accessibleToilet: 'Nhà vệ sinh cho người khuyết tật',
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
