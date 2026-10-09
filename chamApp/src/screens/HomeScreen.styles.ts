import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../components/ui/IconButton.tsx';
import { SHELTER_SELECTED_COLOR } from '../store/mapFilters.ts';
import {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  size,
  spacing,
} from '../theme/index.ts';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  background-color: ${colors.surface};
`;

export const HomeScroll = styled.ScrollView`
  flex: 1;
`;

export const TopSection = styled.View`
  display: flex;
  width: 100%;
`;

export const MiddleSection = styled.View`
  display: flex;
  width: 100%;
  gap: 10px;
  margin-top: 16px;
`;

export const ShelterItem = styled.Pressable`
  gap: 5px;
  margin-top: 2px;
  padding: 10px;
  border-radius: 12px;
  background-color: #f8fafc;
  border-width: 1px;
  border-color: ${colors.border};
`;

// 카드가 없을 때 같은 자리·같은 테두리로 상태를 보여줘 화면이 비어 보이지 않게 한다
export const ShelterStatusBox = styled.View`
  margin-top: 2px;
  min-height: 140px;
  justify-content: center;
  border-radius: 12px;
  background-color: #f8fafc;
  border-width: 1px;
  border-color: ${colors.border};
`;

export const ShelterImageFrame = styled.Pressable`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 10px;
  background-color: ${colors.border};
`;

export const ShelterImage = styled.Image`
  width: 100%;
  height: 100%;
`;

// 사진을 덜 가리려고 보이는 크기만 줄인다. 터치 영역은 IconButton 이 hitSlop 으로 44를 채운다
export const IMAGE_NAV_SIZE = 36;

export const ImageNavButton = styled(IconButton)<{
  $position: 'left' | 'right';
}>`
  position: absolute;
  top: 50%;
  ${({ $position }) => `${$position}: 8px;`}
  margin-top: -${IMAGE_NAV_SIZE / 2}px;
`;

export const ImageCounter = styled.View`
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 3px 7px;
  border-radius: 999px;
  background-color: rgba(17, 24, 39, 0.68);
`;

export const ImageCounterText = styled.Text`
  color: ${colors.textOnColor};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;

export const ShelterTitleRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

export const ShelterName = styled.Text`
  width: 100%;
  color: ${colors.text};
  font-size: 14px;
  line-height: 19px;
  font-weight: 800;
`;

export const ShelterMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

export const ShelterMetaIconText = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

export const ShelterMetaText = styled.Text`
  color: ${colors.textTertiary};
  font-size: 12px;
  line-height: 18px;
`;

export const ShelterMeta = styled.Text`
  color: ${colors.textTertiary};
  font-size: 12px;
  line-height: 18px;
`;

export const ChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
`;

export const TypeChip = styled.View`
  padding: 4px 7px;
  border-radius: 999px;
  background-color: ${SHELTER_SELECTED_COLOR};
`;

export const TypeChipText = styled.Text`
  color: ${colors.textOnColor};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;

// 왼쪽 앱 로고·이름, 오른쪽 언어 버튼. 언어 버튼만 있으면 상단이 비어 보여 브랜드를 함께 둔다.
export const LanguageRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing.md}px;
  padding-top: ${spacing.md}px;
`;

export const BrandRow = styled.View`
  flex-shrink: 1;
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
`;

export const BrandLogo = styled.Image`
  width: 32px;
  height: 36px;
`;

export const BrandTitle = styled.Text`
  color: ${colors.brand};
  font-size: ${fontSize.display}px;
  font-weight: ${fontWeight.heavy};
`;

export const MessageBox = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.mdPlus}px;
  width: 100%;
  min-height: ${size.touchMin}px;
  margin-top: ${spacing.md}px;
  padding-right: ${spacing.lg}px;
  border-width: 1px;
  border-color: ${colors.border};
  border-radius: ${radius.sm}px;
  background-color: ${colors.surface};
  overflow: hidden;
`;

// 모달 헤더와 같은 단계색. 색만으로 구분되지 않게 옆에 단계 라벨을 같이 둔다
export const MessageStepBar = styled.View<{ $color: string }>`
  width: 4px;
  align-self: stretch;
  background-color: ${({ $color }) => $color};
`;

export const MessageTextBox = styled.View`
  flex: 1;
  gap: ${spacing.xxs}px;
  padding: ${spacing.mdPlus}px 0;
`;

export const MessageMetaRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.sm}px;
`;

export const MessageStepLabel = styled.Text<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: ${fontSize.label}px;
  line-height: ${lineHeight.label}px;
  font-weight: ${fontWeight.heavy};
`;

export const MessageAgoText = styled.Text`
  color: ${colors.textMuted};
  font-size: ${fontSize.label}px;
  line-height: ${lineHeight.label}px;
  font-weight: ${fontWeight.medium};
`;

export const MessageTitle = styled.Text`
  color: ${colors.text};
  font-size: ${fontSize.bodyLg}px;
  line-height: ${lineHeight.bodyLg}px;
  font-weight: ${fontWeight.bold};
`;

export const MessageBox2 = styled.View`
  display: flex;
  background-color: #edf5ff;
  margin-top: 14px;
  margin-left: 24px;
  padding: 12px;
  border-radius: 0 8px 8px 8px;
`;

export const TopBox = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

export const SummaryRow = styled.View`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
`;

export const SummaryDot = styled.View`
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background-color: ${colors.inverse};
  margin-top: 8px;
`;

export const MessageTitle2 = styled.Text`
  flex: 1;
  color: #2776e0;
  font-size: 16px;
  font-weight: 600;
`;

export const TimeText = styled.Text`
  flex-shrink: 0;
  font-size: 14px;
  color: ${colors.textMuted};
`;

export const CenterBox = styled.View`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
`;

export const SummaryText = styled.Text`
  color: ${colors.inverse};
  font-size: 14px;
  line-height: 20px;
  flex: 1;
  font-weight: 500;
`;

export const DisasterMoreButton = styled.Pressable`
  align-self: flex-end;
  min-height: ${size.touchMin}px;
  justify-content: center;
  margin-top: 4px;
  padding: 0 0 0 12px;
`;

export const DisasterMoreText = styled.Text`
  color: ${colors.textMuted};
  font-size: 13px;
  font-weight: 600;
`;

export const ModalOverlay = styled.Pressable`
  flex: 1;
  justify-content: center;
  padding: 24px;
  background-color: rgba(15, 23, 42, 0.45);
`;

export const ModalCard = styled.Pressable`
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 18px;
  background-color: ${colors.surface};
`;

export const NoticeModalCard = styled(ModalCard)`
  gap: 14px;
  padding: 18px;
`;

export const NoticeModalHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const NoticeModalCategory = styled.Text`
  color: ${colors.brandDeep};
  font-size: 16px;
  font-weight: 800;
`;

export const NoticeImage = styled.Image`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background-color: ${colors.border};
`;

export const NoticeContent = styled.Text`
  color: ${colors.textTertiary};
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
`;

export const NoticeButtonRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

export const SMSCard = styled.Pressable`
  overflow: hidden;
  border-radius: 20px;
  background-color: ${colors.surface};
`;

export const SMSHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 14px 12px 14px 18px;
`;

export const SMSStepText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 18px;
  font-weight: 800;
`;

export const SMSCategoryChip = styled.View`
  flex-shrink: 1;
  padding: 3px 10px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.22);
`;

export const SMSCategoryText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 13px;
  font-weight: 700;
`;

export const SMSHeaderSpacer = styled.View`
  flex: 1;
`;

export const SMSBody = styled.View`
  gap: 10px;
  padding: 16px 18px 18px;
`;

export const SMSMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const SMSMetaText = styled.Text`
  flex-shrink: 1;
  color: ${colors.textTertiary};
  font-size: 14px;
  font-weight: 500;
`;

export const SMSContentBox = styled.View`
  margin-top: 4px;
  max-height: 320px;
  border-left-width: 4px;
  border-radius: 12px;
  background-color: #f8fafc;
`;

export const SMSContentScroll = styled.ScrollView`
  padding: 14px 16px;
`;

export const SMSContentText = styled.Text`
  color: ${colors.text};
  font-size: 16px;
  line-height: 26px;
  font-weight: 500;
`;

export const SMSPager = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const SMSPagerText = styled.Text`
  min-width: 48px;
  color: ${colors.textSecondary};
  font-size: 14px;
  font-weight: 700;
  text-align: center;
`;

export const SMSActions = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 4px;
`;
