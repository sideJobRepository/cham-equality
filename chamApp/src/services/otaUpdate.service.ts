import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HotUpdater,
  type HotUpdaterResolver,
  type ResolverCheckUpdateParams,
} from '@hot-updater/react-native';
import api from '../lib/axiosInstance';

// JS 번들 OTA 업데이트(hot-updater). 확인 서버는 chamApi(/api/app/bundles/check)이고,
// 번들 zip은 서버가 주는 S3 presigned URL에서 받는다.
// 네이티브가 같은(지문이 같은) 앱에만 내려가므로 라이브러리·권한 추가 같은 변경은 여전히 스토어 업데이트로 나간다.

const BETA_STORAGE_KEY = 'ota.betaChannel';

type CheckUpdateResult = Awaited<
  ReturnType<NonNullable<HotUpdaterResolver['checkUpdate']>>
>;

interface BundleCheckResponse {
  id: string;
  status: 'UPDATE' | 'ROLLBACK';
  shouldForceUpdate: boolean;
  message: string | null;
  fileUrl: string | null;
  fileHash: string | null;
}

/** 테스터 기기인지. 켜 두면 아직 전체 배포 전인 번들도 받는다. */
export async function isBetaChannelEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BETA_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setBetaChannelEnabled(enabled: boolean) {
  await AsyncStorage.setItem(BETA_STORAGE_KEY, enabled ? 'true' : 'false');
}

async function checkUpdate(
  params: ResolverCheckUpdateParams,
): Promise<CheckUpdateResult> {
  // 지문 없이 만든 빌드(로컬 디버그 등)는 어떤 번들이 맞는지 알 수 없어 확인하지 않는다.
  if (!params.fingerprintHash) return null;

  const channel = (await isBetaChannelEnabled()) ? 'alpha' : 'production';
  const { data } = await api.get('/api/app/bundles/check', {
    params: {
      platform: params.platform,
      channel,
      fingerprint: params.fingerprintHash,
      bundleId: params.bundleId,
      minBundleId: params.minBundleId,
    },
    timeout: params.requestTimeout,
  });
  const bundle: BundleCheckResponse | null = data?.data ?? null;
  if (!bundle) return null;

  return {
    id: bundle.id,
    status: bundle.status,
    shouldForceUpdate: bundle.shouldForceUpdate,
    message: bundle.message,
    fileUrl: bundle.fileUrl,
    fileHash: bundle.fileHash,
  } as CheckUpdateResult;
}

/** index.js에서 컴포넌트 등록 전에 한 번. 새 번들이 정상 실행됐다고 네이티브에 알려 자동 롤백을 막는다. */
export function initOtaUpdates() {
  HotUpdater.init({ resolver: { checkUpdate } });
}

/**
 * 새 번들이 있으면 받아만 두고 다음 실행 때 적용한다(쓰는 중에 화면이 바뀌지 않게).
 * 롤백이나 관리자가 강제로 지정한 번들만 받자마자 재시작한다.
 * 업데이트는 부가 기능이라 실패해도 조용히 넘긴다.
 */
export async function runOtaUpdate() {
  try {
    const update = await HotUpdater.checkForUpdate({
      updateStrategy: 'fingerprint',
    });
    if (!update) return;
    const applied = await update.updateBundle();
    if (applied && update.shouldForceUpdate) {
      await HotUpdater.reload();
    }
  } catch {
    // 네트워크 오류·서버 오류는 다음 실행 때 다시 확인한다.
  }
}

export function useOtaUpdate() {
  useEffect(() => {
    if (__DEV__) return;
    runOtaUpdate();
  }, []);
}

/** 더보기 버전 줄 표시용. 앱에 든 번들이면 null. */
export function getOtaBundleLabel(): string | null {
  try {
    const bundleId = HotUpdater.getBundleId();
    if (!bundleId || bundleId === HotUpdater.getMinBundleId()) return null;
    // UUIDv7 앞부분은 시각이라 서로 비슷하다. 구분되는 뒷자리를 보여 준다.
    return bundleId.slice(-8);
  } catch {
    return null;
  }
}
