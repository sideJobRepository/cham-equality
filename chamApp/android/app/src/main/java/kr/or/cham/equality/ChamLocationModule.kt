package kr.or.cham.equality

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.location.Geocoder
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import java.util.Locale

class ChamLocationModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "ChamLocation"

  private val maxCachedLocationAgeMs = 2 * 60 * 1000L

  @ReactMethod
  fun getCurrentLocation(promise: Promise) {
    val fineGranted = ContextCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.ACCESS_FINE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED
    val coarseGranted = ContextCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.ACCESS_COARSE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED

    if (!fineGranted && !coarseGranted) {
      promise.reject("LOCATION_PERMISSION_DENIED", "위치 권한이 없습니다.")
      return
    }

    val locationManager =
      reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val providers = listOf(
      LocationManager.GPS_PROVIDER,
      LocationManager.NETWORK_PROVIDER,
    ).filter { provider ->
      runCatching { locationManager.isProviderEnabled(provider) }.getOrDefault(false)
    }

    if (providers.isEmpty()) {
      promise.reject("LOCATION_PROVIDER_DISABLED", "사용 가능한 위치 제공자가 없습니다.")
      return
    }

    val recentCachedLocation = providers
      .mapNotNull { provider ->
        runCatching { locationManager.getLastKnownLocation(provider) }.getOrNull()
      }
      .filter(::isRecentEnough)
      .minWithOrNull(compareBy<Location> { it.accuracy }.thenByDescending { it.time })

    val mainHandler = Handler(Looper.getMainLooper())
    var settled = false
    lateinit var listener: LocationListener

    fun finish(resolve: Boolean, location: Location? = null, code: String? = null, message: String? = null) {
      if (settled) return
      settled = true
      runCatching { locationManager.removeUpdates(listener) }
      if (resolve && location != null) {
        promise.resolve(toMap(location))
      } else {
        promise.reject(code ?: "LOCATION_UNAVAILABLE", message ?: "현재 위치를 확인할 수 없습니다.")
      }
    }

    listener = object : LocationListener {
      override fun onLocationChanged(location: Location) {
        finish(resolve = true, location = location)
      }

      override fun onProviderDisabled(provider: String) = Unit
      override fun onProviderEnabled(provider: String) = Unit
      override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
    }

    mainHandler.post {
      runCatching {
        providers.forEach { provider ->
          locationManager.requestLocationUpdates(
            provider,
            0L,
            0f,
            listener,
            Looper.getMainLooper(),
          )
        }
        mainHandler.postDelayed({
          if (recentCachedLocation != null) {
            finish(resolve = true, location = recentCachedLocation)
          } else {
            finish(
              resolve = false,
              code = "LOCATION_TIMEOUT",
              message = "현재 위치 확인 시간이 초과되었습니다.",
            )
          }
        }, 15000L)
      }.onFailure {
        finish(
          resolve = false,
          code = "LOCATION_UNAVAILABLE",
          message = it.message ?: "현재 위치를 확인할 수 없습니다.",
        )
      }
    }
  }

  private fun toMap(location: Location): WritableNativeMap =
    WritableNativeMap().apply {
      putDouble("lat", location.latitude)
      putDouble("lng", location.longitude)
      putDouble("accuracy", location.accuracy.toDouble())
      resolveAddress(location)?.let { putString("address", it) }
    }

  private fun isRecentEnough(location: Location): Boolean =
    System.currentTimeMillis() - location.time <= maxCachedLocationAgeMs

  @Suppress("DEPRECATION")
  private fun resolveAddress(location: Location): String? =
    runCatching {
      val geocoder = Geocoder(reactContext, Locale.KOREA)
      val address = geocoder.getFromLocation(location.latitude, location.longitude, 1)
        ?.firstOrNull()
        ?: return@runCatching null

      listOf(
        address.adminArea,
        address.locality,
        address.subLocality,
        address.thoroughfare,
      )
        .filterNot { it.isNullOrBlank() }
        .distinct()
        .joinToString(" ")
        .ifBlank { address.getAddressLine(0) }
    }.getOrNull()
}
