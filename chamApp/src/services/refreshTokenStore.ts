import * as Keychain from 'react-native-keychain';

// refresh token은 앱 재시작에도 살아남아야 하므로 Keychain(secure storage)에 저장한다.
// access token은 tokenStore.ts에서 메모리로만 들고 있는다.
const SERVICE = 'cham.refresh';

export async function saveRefreshToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('refresh', token, { service: SERVICE });
}

export async function getRefreshToken(): Promise<string | null> {
  const creds = await Keychain.getGenericPassword({ service: SERVICE });
  return creds ? creds.password : null;
}

export async function clearRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
