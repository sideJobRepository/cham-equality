/**
 * @format
 */

import { AppRegistry } from 'react-native';
import Config from 'react-native-config';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import App from './App';
import { name as appName } from './app.json';

if (Config.KAKAO_NATIVE_APP_KEY) {
  initializeKakaoSDK(Config.KAKAO_NATIVE_APP_KEY);
}

AppRegistry.registerComponent(appName, () => App);
