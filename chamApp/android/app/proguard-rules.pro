# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# react-native-config 는 BuildConfig 필드를 리플렉션으로 읽는다.
# 이 규칙이 없으면 R8 이 필드를 지워 릴리스 빌드에서만 .env 값이 비어 버린다.
-keep class kr.or.cham.equality.BuildConfig { *; }

# 아래는 R8 을 다시 켜면서 추가한 규칙이다. (Play Console "DEX 코드 최적화 기준점 미만 - 난독화" 경고 대응)
# 대부분의 라이브러리는 AAR 안에 consumer 규칙을 싣고 오지만, 로그인 SDK 두 개는
# 모델 클래스를 Gson/리플렉션으로 채우므로 공식 문서 규칙을 명시해 둔다.

# 카카오 SDK — https://developers.kakao.com/docs/latest/ko/android/getting-started#project-pro-guard
-keep class com.kakao.sdk.**.model.* { <fields>; }
-keep class * extends com.google.gson.TypeAdapter
-keep interface com.kakao.sdk.**.*Api
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement

# 네이버 로그인 SDK — 응답 모델을 Gson 으로 역직렬화한다
-keep public class com.nhn.android.naverlogin.** { public protected *; }
-keep public class com.navercorp.nid.** { *; }

# 크래시 스택트레이스를 Play Console 에서 원래 줄번호로 되돌리기 위해 남긴다.
# (매핑 파일은 AAB 에 자동 포함되어 Play 가 역난독화한다)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
