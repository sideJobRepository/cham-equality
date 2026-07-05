import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { useLocationStore } from '../store/location.ts';

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
  console.log('address', address);
  const locationStatusText =
    status === 'checking'
      ? t('map.location.checking')
      : status === 'granted'
      ? address || t('map.location.addressChecking')
      : status === 'denied'
      ? t('map.location.permissionRequired')
      : errorMessage || t('map.location.unavailable');

  return (
    <HeaderRow>
      <Description numberOfLines={1}>{locationStatusText}</Description>
      {status === 'granted' && location && actionLabel && onAction ? (
        <LocationButton onPress={onAction}>
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

const Description = styled.Text`
  flex: 1;
  color: #6b7280;
  font-size: 12px;
`;

const LocationButton = styled.Pressable`
  flex-shrink: 0;
  padding: 8px 10px;
  border-radius: 999px;
  background-color: #ef4444;
`;

const LocationButtonText = styled.Text`
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
`;
