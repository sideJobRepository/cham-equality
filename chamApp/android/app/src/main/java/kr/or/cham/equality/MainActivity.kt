package kr.or.cham.equality

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // super.onCreate 전에 설치해야 스플래시 테마가 AppTheme 로 제대로 넘어간다.
    val splashScreen = installSplashScreen()

    // 기본 동작은 첫 프레임에서 바로 걷히는데, 그 시점엔 RN 이 아직 JS 를 읽는 중이라 흰 화면이 번쩍인다.
    // JS 의 SplashOverlay 가 같은 화면을 그린 뒤 ChamSplash.hide() 를 부를 때까지 붙잡아 둔다.
    SplashGate.released = false
    splashScreen.setKeepOnScreenCondition { !SplashGate.released }

    // JS 가 죽거나 늦어도 스플래시에 갇히지 않도록 안전장치.
    Handler(Looper.getMainLooper()).postDelayed({ SplashGate.released = true }, SPLASH_TIMEOUT_MS)

    // 걷힐 때 뚝 끊기지 않게 살짝 페이드. 밑에 같은 모양의 JS 오버레이가 있어 자연스럽게 이어진다.
    splashScreen.setOnExitAnimationListener { provider ->
      provider.view
        .animate()
        .alpha(0f)
        .setDuration(SPLASH_FADE_MS)
        .withEndAction { provider.remove() }
        .start()
    }

    super.onCreate(savedInstanceState)
  }

  // JS 쪽 뒤로가기 처리(모달 닫기·탭 이동 등)가 아무것도 안 했을 때 불린다.
  // 기본 동작(Android 12+)은 화면을 살려 둔 채 뒤로 숨겨서 다시 켜면 스플래시 없이 그대로 돌아온다.
  // 사용자가 앱을 "닫은" 것으로 보고 화면을 정리해, 다시 켤 때 스플래시가 다시 돌게 한다(배민 등과 같은 동작).
  // 프로세스·JS 는 살아 있어 처음 실행보다 빠르다. 홈 버튼·앱 전환은 이 경로를 타지 않는다.
  override fun invokeDefaultOnBackPressed() {
    finish()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "chamApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  private companion object {
    const val SPLASH_TIMEOUT_MS = 4000L
    const val SPLASH_FADE_MS = 200L
  }
}

/** 네이티브 스플래시를 언제 걷을지 JS(ChamSplashModule) 와 MainActivity 가 공유하는 플래그. */
object SplashGate {
  @Volatile var released: Boolean = false
}
