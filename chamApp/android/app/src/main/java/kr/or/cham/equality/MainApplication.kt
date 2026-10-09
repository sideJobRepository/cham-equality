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
    )
  }

  override fun onCreate() {
    super.onCreate()
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
