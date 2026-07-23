/**
 * @format
 */

import { AppRegistry } from 'react-native';
import Config from 'react-native-config';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import NaverLogin from '@react-native-seoul/naver-login';
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

AppRegistry.registerComponent(appName, () => App);

