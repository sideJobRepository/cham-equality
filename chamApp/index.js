/**
 * @format
 */

import { AppRegistry } from 'react-native';
import Config from 'react-native-config';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import NaverLogin from '@react-native-seoul/naver-login';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import App from './App';
import './src/i18n';
import { name as appName } from './app.json';

if (Config.KAKAO_NATIVE_APP_KEY) {
  initializeKakaoSDK(Config.KAKAO_NATIVE_APP_KEY);
}

if (Config.NAVER_CLIENT_KEY && Config.NAVER_CLIENT_SECRET) {
  NaverLogin.initialize({
    appName: Config.NAVER_APP_NAME || 'chamApp',
    consumerKey: Config.NAVER_CLIENT_KEY,
    consumerSecret: Config.NAVER_CLIENT_SECRET,
    serviceUrlSchemeIOS: Config.NAVER_SERVICE_URL_SCHEME_IOS,
    disableNaverAppAuthIOS: true,
  });
}

// 앱이 백그라운드·종료 상태일 때 재난문자 알림은 OS가 직접 띄운다. 여기서 할 일은 없지만
// 핸들러를 등록해 두지 않으면 RN Firebase가 경고를 낸다. 반드시 컴포넌트 등록 전에 둬야 한다.
setBackgroundMessageHandler(getMessaging(), async () => {});

AppRegistry.registerComponent(appName, () => App);

