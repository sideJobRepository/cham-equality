import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { LocateFixed } from 'lucide-react-native';
import { useLocationStore } from '../store/location.ts';
import { colors, size, spacing } from '../theme/index.ts';

interface CurrentLocationBarProps {
  actionLabel?: string;
  onAction?: () => void;
}

export default function CurrentLocationBar({
  actionLabel,
  onAction,
}: CurrentLocationBarProps) {
  const { t } = useTranslation();
  const status = useLocationStore(state => state.status);
  const location = useLocationStore(state => state.location);

  const address = useLocationStore(state => state.address);
  const errorMessage = useLocationStore(state => state.errorMessage);
  const locationStatusText =
    status === 'checking'
      ? t('map.location.checking')
      : status === 'granted'
      ? address || t('map.location.addressChecking')
      : status === 'denied'
      ? t('map.location.permissionRequired')
      : // errorMessage 는 번역 키다(useCurrentLocation 참고).
        t(errorMessage || 'map.location.unavailable');

  return (
    <HeaderRow>
      <LocationLabel>
        <LocationIconBox>
          <LocateFixed color={colors.primary} size={15} strokeWidth={2.6} />
        </LocationIconBox>
        <Description numberOfLines={1}>{locationStatusText}</Description>
      </LocationLabel>
      {status === 'granted' && location && actionLabel && onAction ? (
        <LocationButton
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <LocationButtonText>{actionLabel}</LocationButtonText>
        </LocationButton>
      ) : null}
    </HeaderRow>
  );
}

const HeaderRow = styled.View`
  min-height: 34px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const LocationLabel = styled.View`
  flex: 1;
  min-width: 0;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const LocationIconBox = styled.View`
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background-color: ${colors.primarySoft};
`;

const Description = styled.Text`
  flex: 1;
  min-width: 0;
  color: ${colors.textMuted};
  font-size: 12px;
`;

// 빨강은 위급·오류 전용이라 일반 동작 버튼은 브랜드 남색으로 둔다
const LocationButton = styled.Pressable`
  flex-shrink: 0;
  min-height: ${size.touchMin}px;
  justify-content: center;
  padding: 0 ${spacing.lg}px;
  border-radius: 999px;
  background-color: ${colors.brand};
`;

const LocationButtonText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 12px;
  font-weight: 800;
`;
