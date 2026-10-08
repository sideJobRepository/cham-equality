package kr.or.cham.equality

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** JS 오버레이가 화면을 그린 뒤 네이티브 스플래시를 걷어 달라고 알리는 모듈. */
class ChamSplashModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "ChamSplash"

  @ReactMethod
  fun hide() {
    SplashGate.released = true
  }
}
