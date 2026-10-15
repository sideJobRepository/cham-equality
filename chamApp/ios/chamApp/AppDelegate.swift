import UIKit
import FirebaseCore
import HotUpdater
import KakaoSDKAuth
import KakaoSDKCommon
import NaverThirdPartyLogin
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // 푸시(FCM). GoogleService-Info.plist 는 커밋하지 않고 CI가 시크릿으로 복원한다.
    FirebaseApp.configure()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "chamApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // 카카오톡·네이버 로그인을 마치고 앱으로 돌아올 때 들어오는 URL을 각 SDK에 넘긴다.
  // 스킴은 Info.plist 의 CFBundleURLTypes 와 같다.
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    // JS(index.js)에서 카카오 SDK를 초기화하기 전이면 appKey()가 throw 하므로 먼저 확인한다.
    if (try? KakaoSDK.shared.appKey()) != nil, AuthApi.isKakaoTalkLoginUrl(url) {
      return AuthController.handleOpenUrl(url: url)
    }
    if url.scheme == "chamequalitynaver" {
      return NaverThirdPartyLoginConnection.getSharedInstance().application(app, open: url, options: options)
    }
    return RCTLinkingManager.application(app, open: url, options: options)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    // OTA로 받은 JS 번들이 있으면 그걸, 없으면 앱에 든 main.jsbundle을 쓴다.
    HotUpdater.bundleURL()
#endif
  }
}
