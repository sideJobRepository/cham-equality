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
        naver: '네이버로 로그인',
        apple: 'Apple로 로그인',
        logout: '로그아웃',
        greeting: '{{name}}님 환영합니다',
        withdraw: '회원 탈퇴',
        withdrawConfirmTitle: '회원 탈퇴',
        withdrawConfirmDesc:
          '탈퇴하면 계정과 내 제보가 삭제되며 되돌릴 수 없습니다. 계속하시겠습니까?',
        withdrawDone: '회원 탈퇴가 완료되었습니다.',
        withdrawFailed: '회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.',
      },
      more: {
        citizenServices: '연결된 시민 서비스',
        foodMap: '대전참여자치시민연대 맛집지도',
        chamSite: '대전참여자치시민연대',
        appSettings: '언어 설정',
        languageSettings: '언어 설정',
        login: '로그인',
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
        naver: 'Log in with Naver',
        apple: 'Sign in with Apple',
        logout: 'Log out',
        greeting: 'Welcome, {{name}}',
        withdraw: 'Delete account',
        withdrawConfirmTitle: 'Delete account',
        withdrawConfirmDesc:
          'Deleting your account permanently removes your account and your reports. This cannot be undone. Continue?',
        withdrawDone: 'Your account has been deleted.',
        withdrawFailed: 'Failed to delete account. Please try again later.',
      },
      more: {
        citizenServices: 'Connected Civic Services',
        foodMap: 'Daejeon PSPD Food Map',
        chamSite: 'Daejeon PSPD',
        appSettings: 'Language Settings',
        languageSettings: 'Language Settings',
        login: 'Login',
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
        naver: '使用 Naver 登录',
        apple: '使用 Apple 登录',
        logout: '退出登录',
        greeting: '欢迎，{{name}}',
        withdraw: '注销账号',
        withdrawConfirmTitle: '注销账号',
        withdrawConfirmDesc: '注销后账号和您的举报将被永久删除，且无法恢复。是否继续？',
        withdrawDone: '账号已注销。',
        withdrawFailed: '注销失败，请稍后重试。',
      },
      more: {
        citizenServices: '已连接的市民服务',
        foodMap: '大田参与自治市民联盟美食地图',
        chamSite: '大田参与自治市民联盟',
        appSettings: '语言设置',
        languageSettings: '语言设置',
        login: '登录',
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
        naver: 'Naverでログイン',
        apple: 'Appleでログイン',
        logout: 'ログアウト',
        greeting: '{{name}}さん、ようこそ',
        withdraw: '退会する',
        withdrawConfirmTitle: '退会する',
        withdrawConfirmDesc:
          '退会するとアカウントと提報が完全に削除され、元に戻せません。続行しますか？',
        withdrawDone: '退会が完了しました。',
        withdrawFailed: '退会に失敗しました。しばらくしてから再度お試しください。',
      },
      more: {
        citizenServices: '連携された市民サービス',
        foodMap: '大田参与自治市民連帯グルメマップ',
        chamSite: '大田参与自治市民連帯',
        appSettings: '言語設定',
        languageSettings: '言語設定',
        login: 'ログイン',
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
        naver: 'Đăng nhập bằng Naver',
        apple: 'Đăng nhập bằng Apple',
        logout: 'Đăng xuất',
        greeting: 'Xin chào, {{name}}',
        withdraw: 'Xóa tài khoản',
        withdrawConfirmTitle: 'Xóa tài khoản',
        withdrawConfirmDesc:
          'Xóa tài khoản sẽ xóa vĩnh viễn tài khoản và các báo cáo của bạn, không thể hoàn tác. Tiếp tục?',
        withdrawDone: 'Tài khoản của bạn đã được xóa.',
        withdrawFailed: 'Xóa tài khoản thất bại. Vui lòng thử lại sau.',
      },
      more: {
        citizenServices: 'Dịch vụ công dân đã kết nối',
        foodMap: 'Bản đồ quán ăn Daejeon PSPD',
        chamSite: 'Daejeon PSPD',
        appSettings: 'Cài đặt ngôn ngữ',
        languageSettings: 'Cài đặt ngôn ngữ',
        login: 'Đăng nhập',
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

