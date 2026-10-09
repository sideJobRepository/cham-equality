import styled from 'styled-components/native';
import { ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
} from '../../theme/index.ts';

interface ShelterNoPhotoBannerProps {
  typeLabel: string;
}

// 사진이 없을 때 큰 기본 표지판 이미지가 이름·칩을 화면 밖으로 밀어내던 것을 낮은 배너로 대신한다.
// 유형은 바로 아래 칩에서 이미 읽히므로 스크린리더에서는 장식으로 숨긴다.
export default function ShelterNoPhotoBanner({
  typeLabel,
}: ShelterNoPhotoBannerProps) {
  const { t } = useTranslation();

  return (
    <Banner
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <IconCircle>
        <ShieldCheck color={colors.textMuted} size={22} strokeWidth={2.2} />
      </IconCircle>
      <TextBox>
        <TypeText numberOfLines={1}>{typeLabel}</TypeText>
        <NoPhotoText numberOfLines={1}>{t('map.labels.noPhoto')}</NoPhotoText>
      </TextBox>
    </Banner>
  );
}

const Banner = styled.View`
  height: 80px;
  flex-direction: row;
  align-items: center;
  gap: ${spacing.lg}px;
  padding: 0 ${spacing.xl}px;
  border-radius: 10px;
  background-color: ${colors.surfaceMuted};
`;

const IconCircle = styled.View`
  width: 44px;
  height: 44px;
  border-radius: ${radius.full}px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surface};
`;

const TextBox = styled.View`
  flex: 1;
  gap: ${spacing.xxs}px;
`;

const TypeText = styled.Text`
  color: ${colors.textSecondary};
  font-size: ${fontSize.body}px;
  line-height: ${lineHeight.body}px;
  font-weight: ${fontWeight.bold};
`;

const NoPhotoText = styled.Text`
  color: ${colors.textTertiary};
  font-size: ${fontSize.caption}px;
  line-height: ${lineHeight.caption}px;
`;
