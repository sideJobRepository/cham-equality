module.exports = {
  dependencies: {
    '@react-native-kakao/core': {
      platforms: {
        android: {
          cmakeListsPath: null,
          libraryName: null,
        },
      },
    },
    // iOS 위치 전용. 안드로이드는 자체 ChamLocation 모듈을 쓴다.
    '@react-native-community/geolocation': {
      platforms: {
        android: null,
      },
    },
    '@react-native-kakao/user': {
      platforms: {
        android: {
          cmakeListsPath: null,
          libraryName: null,
        },
      },
    },
  },
};
