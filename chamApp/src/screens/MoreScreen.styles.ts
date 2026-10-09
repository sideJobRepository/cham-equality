import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors, externalBrand, fontSize, size } from '../theme/index.ts';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: #f4f7fb;
`;

export const Content = styled.ScrollView`
  flex: 1;
`;

export const IntroHero = styled.View`
  position: relative;
  min-height: 150px;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 26px 18px;
  overflow: hidden;
  background-color: ${colors.brandDeep};
`;

export const IntroRightGradient = styled(LinearGradient)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 58%;
`;

export const IntroTitle = styled.Text.attrs({
  textBreakStrategy: 'balanced',
  lineBreakStrategyIOS: 'hangul-word',
})`
  z-index: 1;
  width: 100%;
  flex-shrink: 1;
  color: ${colors.textOnColor};
  font-size: 19px;
  line-height: 27px;
  font-weight: 800;
  text-align: center;
`;

export const IntroDescription = styled.Text.attrs({
  textBreakStrategy: 'balanced',
  lineBreakStrategyIOS: 'hangul-word',
})`
  z-index: 1;
  width: 100%;
  flex-shrink: 1;
  color: #d7e2e6;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  text-align: center;
`;

export const Section = styled.View`
  margin-top: 24px;
  gap: 12px;
  padding: 0 12px;
`;

export const SectionTitle = styled.Text`
  color: ${colors.text};
  font-size: 16px;
  font-weight: 700;
`;

export const ServiceList = styled.View`
  overflow: hidden;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const ServiceButton = styled.Pressable`
  min-height: 54px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f1f5f9;
`;

export const ServiceLabel = styled.View`
  flex: 1;
  min-width: 0;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const ServiceIcon = styled.Image<{
  $width: number;
  $aspectRatio: number;
}>`
  width: ${({ $width }) => $width}px;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
`;

export const ServiceText = styled.Text`
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${colors.text};
`;

export const SettingBlock = styled.View`
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const LanguageRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

export const LanguageButton = styled.Pressable<{ $active: boolean }>`
  min-height: ${size.touchMin}px;
  padding: 6px 12px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${({ $active }) =>
    $active ? colors.primary : colors.surfaceMuted};
`;

export const LanguageText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? colors.textOnColor : colors.textMuted)};
  font-size: 13px;
  font-weight: 700;
`;

export const LoginBlock = styled.View`
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const Greeting = styled.Text`
  font-size: 14px;
  font-weight: 700;
`;

export const KakaoButton = styled.Pressable`
  height: 50px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background-color: ${externalBrand.kakao};
`;

export const LoginIcon = styled.Image`
  width: 20px;
  height: 20px;
`;

export const AppleLoginIcon = styled(LoginIcon)`
  tint-color: ${colors.textOnColor};
`;

export const KakaoText = styled.Text`
  color: ${externalBrand.kakaoText};
  font-size: 15px;
  font-weight: 800;
`;

export const NaverButton = styled.Pressable`
  height: 50px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background-color: ${externalBrand.naver};
`;

export const NaverIconText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 18px;
  font-weight: 900;
`;

export const NaverText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 15px;
  font-weight: 800;
`;

export const AppleButton = styled.Pressable`
  height: 50px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background-color: ${externalBrand.apple};
`;

export const AppleText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 15px;
  font-weight: 800;
`;

export const WithdrawButton = styled.Pressable`
  min-height: ${size.touchMin}px;
  align-items: center;
  justify-content: center;
`;

export const WithdrawText = styled.Text`
  color: ${colors.textMuted};
  font-size: 13px;
  font-weight: 600;
  text-decoration-line: underline;
`;

export const FeedbackEntryButton = styled.Pressable`
  min-height: 54px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const FeedbackIconBox = styled.View`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.primarySoft};
`;

export const FeedbackModalCard = styled.Pressable`
  max-height: 90%;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  background-color: ${colors.surface};
`;

export const FeedbackModalScroll = styled.ScrollView`
  max-height: 560px;
`;

export const FeedbackField = styled.View`
  gap: 8px;
  margin-bottom: 14px;
`;

export const FeedbackLabel = styled.Text`
  color: ${colors.text};
  font-size: 13px;
  font-weight: 800;
`;

export const FeedbackChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

export const FeedbackCategoryChip = styled.Pressable<{ $active: boolean }>`
  min-height: 36px;
  padding: 0 11px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active }) =>
    $active ? colors.primary : colors.surfaceMuted};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? colors.primary : colors.border)};
`;

export const FeedbackCategoryText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) =>
    $active ? colors.textOnColor : colors.textTertiary};
  font-size: 12px;
  font-weight: 800;
`;

export const FeedbackTextArea = styled.TextInput`
  min-height: 128px;
  padding: 12px;
  border-radius: 10px;
  color: ${colors.text};
  font-size: 14px;
  line-height: 20px;
  background-color: ${colors.background};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const FeedbackInput = styled.TextInput`
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  color: ${colors.text};
  font-size: 14px;
  background-color: ${colors.background};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const FeedbackCount = styled.Text`
  color: ${colors.textMuted};
  font-size: ${fontSize.caption}px;
  font-weight: 700;
  text-align: right;
`;

export const FeedbackImageItem = styled.View`
  min-height: 58px;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 12px;
  background-color: ${colors.background};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const FeedbackImagePreview = styled.Image`
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background-color: ${colors.border};
`;

export const FeedbackImageName = styled.Text`
  flex: 1;
  min-width: 0;
  color: ${colors.textSecondary};
  font-size: 12px;
  font-weight: 700;
`;

export const ReportListBlock = styled.View`
  overflow: hidden;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const ReportListButton = styled.Pressable`
  min-height: 64px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom-width: 1px;
  border-bottom-color: #f1f5f9;
`;

export const ReportListIconBox = styled.View`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.primarySoft};
`;

export const ReportListBody = styled.View`
  flex: 1;
  min-width: 0;
  gap: 4px;
`;

export const ReportListTitle = styled.Text`
  color: ${colors.text};
  font-size: 14px;
  font-weight: 800;
`;

export const ReportListMeta = styled.Text`
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 600;
`;

export const ReportEmptyText = styled.Text`
  padding: 18px 14px;
  color: ${colors.textMuted};
  font-size: 13px;
  font-weight: 600;
  text-align: center;
`;

export const ReportModalOverlay = styled.Pressable`
  flex: 1;
  justify-content: flex-end;
  padding: 16px;
  background-color: rgba(17, 24, 39, 0.32);
`;

export const ReportModalCard = styled.Pressable`
  height: 90%;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  background-color: ${colors.surface};
`;

export const ReportModalHeader = styled.View`
  min-height: 34px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const ReportModalTitle = styled.Text`
  flex: 1;
  color: ${colors.text};
  font-size: 18px;
  font-weight: 800;
`;

export const ReportDetailLoading = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const ReportDetailScroll = styled.ScrollView`
  flex: 1;
`;

export const ReportDetailName = styled.Text`
  color: ${colors.text};
  font-size: 17px;
  line-height: 24px;
  font-weight: 800;
`;

export const ReportDetailAddress = styled.Text`
  margin-top: 4px;
  color: ${colors.textTertiary};
  font-size: 13px;
  line-height: 19px;
  font-weight: 600;
`;

export const ReportDetailStatus = styled.Text`
  align-self: flex-start;
  margin-top: 10px;
  padding: 5px 9px;
  border-radius: 999px;
  overflow: hidden;
  color: ${colors.primary};
  font-size: 12px;
  font-weight: 800;
  background-color: ${colors.primarySoft};
`;

export const ReportDetailSection = styled.View`
  gap: 8px;
  margin-top: 18px;
`;

export const ReportDetailSectionTitle = styled.Text`
  color: ${colors.text};
  font-size: 14px;
  font-weight: 800;
`;

export const ReportChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 7px;
`;

export const ReportAccessChip = styled.View<{ $active: boolean }>`
  padding: 6px 9px;
  border-radius: 999px;
  background-color: ${({ $active }) =>
    $active ? colors.primary : colors.surfaceMuted};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? colors.primary : colors.border)};
`;

export const ReportAccessChipText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) =>
    $active ? colors.textOnColor : colors.textDisabled};
  font-size: 12px;
  font-weight: 800;
`;

export const ReportDetailText = styled.Text`
  color: ${colors.textTertiary};
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
`;

export const ReportDetailImageRow = styled.View`
  flex-direction: row;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background-color: ${colors.background};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const ReportDetailImage = styled.Image`
  width: 76px;
  height: 76px;
  border-radius: 10px;
  background-color: ${colors.border};
`;

export const ReportDetailImagePlaceholder = styled.View`
  width: 76px;
  height: 76px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surfaceMuted};
`;

export const ReportDetailImageInfo = styled.View`
  flex: 1;
  min-width: 0;
  gap: 6px;
`;

export const ReportDetailImageCategory = styled.Text`
  color: ${colors.text};
  font-size: 13px;
  font-weight: 800;
`;

export const ReportDetailImageDescription = styled.Text`
  color: ${colors.textTertiary};
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
`;

export const NotificationRow = styled.View`
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

export const NotificationTextBox = styled.View`
  flex: 1;
  gap: 2px;
`;

export const NotificationLabel = styled.Text`
  color: ${colors.text};
  font-size: 15px;
  font-weight: 700;
`;

export const NotificationDescription = styled.Text`
  color: ${colors.textMuted};
  font-size: 13px;
  line-height: 18px;
`;

export const NotificationDivider = styled.View`
  height: 1px;
  background-color: ${colors.surfaceMuted};
`;

export const NotificationPermissionBox = styled.View`
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background-color: ${colors.warningSoft};
`;

export const NotificationPermissionText = styled.Text`
  color: ${colors.warningText};
  font-size: 13px;
  line-height: 19px;
`;

export const NotificationSettingsButton = styled.Pressable`
  align-self: flex-start;
  min-height: 44px;
  justify-content: center;
  padding: 0 14px;
  border-radius: 8px;
  background-color: ${colors.warning};
`;

export const NotificationSettingsText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 14px;
  font-weight: 700;
`;
