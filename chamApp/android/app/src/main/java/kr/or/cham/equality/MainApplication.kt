package kr.or.cham.equality

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.hotupdater.HotUpdater

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(ChamLocationPackage())
        },
      // OTA로 받은 JS 번들이 있으면 그걸, 없으면 APK에 든 번들을 쓴다(디버그는 Metro라 무관).
      jsBundleFilePath = HotUpdater.getJSBundleFile(applicationContext),
    )
  }

  override fun onCreate() {
    super.onCreate()
    // OTA(hot-updater) 네이티브 지문. 라이브러리는 이 문자열을 이름으로만 찾아서 R8 리소스 축소가 지워 버린다.
    // 코드에서 직접 읽어 넘기면 지워지지 않는다. 비어 있으면(지문 없이 만든 빌드) 업데이트 확인을 건너뛴다.
    // reactHost(번들 경로 결정)보다 먼저 불러야 한다.
    HotUpdater.configure(
      fingerprintHash = getString(R.string.hot_updater_fingerprint_hash).ifEmpty { null },
    )
    createDisasterChannel()
    loadReactNative(this)
  }

  // 재난문자 푸시 채널. 서버(FcmPushSender.ANDROID_CHANNEL_ID)와 매니페스트 기본 채널 id가 같아야 한다.
  // 중요도 HIGH 라 화면 위에 헤드업으로 뜬다. 이미 있으면 OS가 무시하므로 매번 불러도 된다.
  private fun createDisasterChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      "disaster",
      getString(R.string.notification_channel_disaster),
      NotificationManager.IMPORTANCE_HIGH,
    )
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }
}
