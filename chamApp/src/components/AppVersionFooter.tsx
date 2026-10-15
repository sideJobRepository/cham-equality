import { useEffect, useRef, useState } from 'react';
import { Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import DeviceInfo from 'react-native-device-info';
import {
  getOtaBundleLabel,
  isBetaChannelEnabled,
  runOtaUpdate,
  setBetaChannelEnabled,
} from '../services/otaUpdate.service';
import { useDialogUtil } from '../utils/dialog';
import { colors } from '../theme/index.ts';

// 버전 줄을 이 횟수만큼 빠르게 누르면 테스터용 "베타 업데이트 받기"가 보인다.
const REVEAL_TAP_COUNT = 7;
const TAP_WINDOW_MS = 2000;

/**
 * 더보기 맨 아래 버전 표시 + 숨은 베타 업데이트 토글.
 * 플레이 비공개 테스트와 프로덕션은 같은 앱 파일이라 앱이 스스로 테스터인지 모른다.
 * 그래서 테스터가 이 토글을 켜 두면 아직 전체 배포 전인 JS 번들(OTA)을 먼저 받는다.
 */
export default function AppVersionFooter() {
  const { t: translate } = useTranslation();
  const { alert } = useDialogUtil();
  const [betaEnabled, setBetaEnabled] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    isBetaChannelEnabled().then(enabled => {
      setBetaEnabled(enabled);
      // 이미 켠 기기는 끌 수 있게 처음부터 보여 준다.
      if (enabled) setRevealed(true);
    });
  }, []);

  const onVersionPress = () => {
    const now = Date.now();
    const recentTaps = [
      ...tapTimesRef.current.filter(time => now - time < TAP_WINDOW_MS),
      now,
    ];
    tapTimesRef.current = recentTaps;
    if (recentTaps.length >= REVEAL_TAP_COUNT) setRevealed(true);
  };

  const onBetaChange = async (enabled: boolean) => {
    setBetaEnabled(enabled);
    await setBetaChannelEnabled(enabled);
    // 바로 확인해 받아 두면 다음에 앱을 열 때 적용된다.
    runOtaUpdate();
    alert(translate('more.betaUpdates.changed'), undefined, { tone: 'info' });
  };

  const bundleLabel = getOtaBundleLabel();
  const versionText = bundleLabel
    ? `${DeviceInfo.getVersion()} · ${bundleLabel}`
    : DeviceInfo.getVersion();

  return (
    <Footer>
      {revealed ? (
        <BetaBlock>
          <BetaTextBox>
            <BetaLabel>{translate('more.betaUpdates.title')}</BetaLabel>
            <BetaDescription>
              {translate('more.betaUpdates.description')}
            </BetaDescription>
          </BetaTextBox>
          <Switch
            accessibilityLabel={translate('more.betaUpdates.title')}
            value={betaEnabled}
            onValueChange={onBetaChange}
            trackColor={{ false: colors.borderStrong, true: '#93c5fd' }}
            thumbColor={betaEnabled ? colors.primary : colors.background}
          />
        </BetaBlock>
      ) : null}
      <VersionButton onPress={onVersionPress} accessibilityRole="text">
        <VersionText>
          {translate('more.version', { version: versionText })}
        </VersionText>
      </VersionButton>
    </Footer>
  );
}

const Footer = styled.View`
  gap: 12px;
  padding: 8px 16px 32px;
`;

const BetaBlock = styled.View`
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

const BetaTextBox = styled.View`
  flex: 1;
  gap: 2px;
`;

const BetaLabel = styled.Text`
  color: ${colors.text};
  font-size: 15px;
  font-weight: 700;
`;

const BetaDescription = styled.Text`
  color: ${colors.textMuted};
  font-size: 13px;
  line-height: 18px;
`;

const VersionButton = styled.Pressable`
  min-height: 44px;
  align-items: center;
  justify-content: center;
`;

const VersionText = styled.Text`
  color: ${colors.textMuted};
  font-size: 13px;
`;
