import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import SpInAppUpdates, {
  IAUInstallStatus,
  IAUUpdateKind,
  StatusUpdateEvent,
} from 'sp-react-native-in-app-updates';
import { useDialogUtil } from '../utils/dialog';

// 앱 시작 시 Play 스토어에 새 버전이 있으면 백그라운드로 받아 두고, 다 받으면 재시작할지 묻는다.
// IMMEDIATE(전체 화면 강제) 대신 FLEXIBLE 을 쓰는 이유: 재난 상황에 급히 연 사용자를
// 업데이트 화면으로 막으면 안 되기 때문. 받는 동안에도 앱은 그대로 쓸 수 있다.
// iOS 는 Play In-App Updates 가 없어 대상에서 뺀다.
export function useInAppUpdate() {
  const { t: translate } = useTranslation();
  const { confirm } = useDialogUtil();

  useEffect(() => {
    if (Platform.OS !== 'android' || __DEV__) return;

    const inAppUpdates = new SpInAppUpdates(false);

    const onStatus = async (event: StatusUpdateEvent) => {
      if (event.status !== IAUInstallStatus.DOWNLOADED) return;
      const restart = await confirm(
        translate('update.readyTitle'),
        translate('update.readyDescription'),
      );
      // 거절하면 받아 둔 파일은 남아 있고, 다음에 앱을 완전히 닫았다 열 때 Play 가 적용한다.
      if (restart) inAppUpdates.installUpdate();
    };

    inAppUpdates.addStatusUpdateListener(onStatus);

    // 스토어에서 받지 않은 빌드(직접 설치 APK 등)는 여기서 실패한다. 업데이트 확인은
    // 부가 기능이라 실패해도 앱 사용에 지장이 없게 조용히 넘긴다.
    inAppUpdates
      .checkNeedsUpdate()
      .then(result => {
        if (result.shouldUpdate) {
          return inAppUpdates.startUpdate({
            updateType: IAUUpdateKind.FLEXIBLE,
          });
        }
      })
      .catch(() => {});

    return () => {
      inAppUpdates.removeStatusUpdateListener(onStatus);
    };
    // 시작 시 한 번만 확인한다. t/confirm 이 바뀔 때마다 다시 확인하지 않도록 비운다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
