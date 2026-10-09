import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../theme/index.ts';
import {
  ACCESSIBILITY_SELECTED_COLOR,
  SHELTER_SELECTED_COLOR,
} from '../store/mapFilters.ts';
import {
  MAP_CONTROL_SIZE,
  MAP_CONTROL_GAP,
  PREVIEW_STRIP_HEIGHT,
} from './MapScreen.constants.ts';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #f4f7fb;
`;

export const Header = styled.View`
  padding: 20px 20px 12px;
`;

export const MapFrame = styled.View`
  flex: 1;
  overflow: hidden;
  margin: 10px 12px 0;
  border-radius: 18px;
  background-color: #dbeafe;
`;

export const LoadingBox = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: #eef4ff;
`;

export const EmptyText = styled.Text`
  padding: 24px;
  color: ${colors.textMuted};
  font-size: 14px;
  text-align: center;
`;

export const ErrorText = styled.Text`
  flex-shrink: 1;
  color: ${colors.danger};
  font-size: 13px;
  font-weight: 600;
`;

export const MapErrorOverlay = styled.View`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 56px;
  align-items: flex-start;
`;

export const MapErrorCard = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 12px;
  border-radius: 12px;
  background-color: ${colors.surface};
  elevation: 3;
`;

export const RetryButton = styled.Pressable`
  min-height: 44px;
  padding: 0 14px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.brand};
`;

export const RetryButtonText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 13px;
  font-weight: 700;
`;

export const PanelErrorRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
`;

export const PanelErrorText = styled.Text`
  flex-shrink: 1;
  color: ${colors.danger};
  font-size: 13px;
  font-weight: 700;
`;

export const RegionTrailRow = styled.View`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 56px;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
`;

export const RegionTrailItemView = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
`;

export const RegionTrailChip = styled.TouchableOpacity<{ $current: boolean }>`
  padding: 6px 10px;
  border-radius: 999px;
  background-color: ${({ $current }) =>
    $current ? colors.primary : colors.surface};
  shadow-color: ${colors.shadow};
  shadow-opacity: 0.12;
  shadow-radius: 6px;
  shadow-offset: 0 2px;
  elevation: 3;
`;

export const RegionTrailText = styled.Text<{ $current: boolean }>`
  color: ${({ $current }) => ($current ? colors.textOnColor : colors.text)};
  font-size: 12px;
  font-weight: 700;
`;

export const MapFetchingBadge = styled.View`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background-color: ${colors.surface};
  elevation: 3;
`;

export const MapControls = styled(Animated.View)`
  position: absolute;
  right: 24px;
  gap: ${MAP_CONTROL_GAP}px;
`;

export const MapControlButton = styled.TouchableOpacity.attrs({
  activeOpacity: 0.6,
})`
  width: ${MAP_CONTROL_SIZE}px;
  height: ${MAP_CONTROL_SIZE}px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: ${colors.surface};
  shadow-color: ${colors.shadow};
  shadow-opacity: 0.14;
  shadow-radius: 6px;
  shadow-offset: 0 2px;
  elevation: 4;
`;

export const BottomPanel = styled(Animated.View)`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  gap: 6px;
  padding: 0 10px 10px;
  border-radius: 16px 16px 0 0;
  background-color: ${colors.surface};
  min-height: 0;
  overflow: hidden;
  shadow-color: ${colors.shadow};
  shadow-opacity: 0.14;
  shadow-radius: 12px;
  shadow-offset: 0 -3px;
  elevation: 10;
`;

export const AccessibilityInfoOverlay = styled.Pressable`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 92px 20px 20px;
  background-color: rgba(17, 24, 39, 0.24);
`;

export const AccessibilityInfoCard = styled.Pressable`
  gap: 14px;
  padding: 18px;
  border-radius: 16px;
  background-color: ${colors.surface};
`;

export const AccessibilityInfoHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const AccessibilityInfoTitle = styled.Text`
  flex: 1;
  color: ${colors.text};
  font-size: 17px;
  font-weight: 800;
`;

// 터치 영역 44px(접근성 최소 크기). 음수 여백으로 헤더 높이는 그대로 둔다.
export const AccessibilityInfoCloseButton = styled.Pressable`
  width: 44px;
  height: 44px;
  margin: -5px;
  align-items: center;
  justify-content: center;
`;

export const AccessibilityInfoDescription = styled.Text`
  color: ${colors.textTertiary};
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
`;

export const AccessibilityInfoList = styled.View`
  gap: 8px;
`;

export const AccessibilityInfoText = styled.Text`
  color: ${colors.textSecondary};
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
`;

export const AccessibilityLegendList = styled.View`
  gap: 8px;
  padding-top: 2px;
`;

export const AccessibilityLegendRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
`;

export const AccessibilityLegendDot = styled.View<{ $color: string }>`
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 999px;
  background-color: ${({ $color }) => $color};
`;

export const AccessibilityLegendText = styled.Text`
  flex: 1;
  color: ${colors.textSecondary};
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
`;

export const AccessibilityInfoButton = styled.Pressable`
  align-self: flex-end;
  padding: 10px 14px;
  border-radius: 10px;
  background-color: ${colors.surfaceMuted};
`;

export const AccessibilityInfoButtonText = styled.Text`
  color: ${colors.text};
  font-size: 14px;
  font-weight: 700;
`;

export const PanelHandleButton = styled.View`
  height: 42px;
  align-items: center;
  justify-content: center;
`;

export const PanelHandleBar = styled.View`
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background-color: ${colors.borderStrong};
`;

export const PanelHeader = styled.View`
  min-height: 26px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const PanelTitle = styled.Text`
  flex: 1;
  color: ${colors.text};
  font-size: 17px;
  font-weight: 800;
`;

export const PanelCount = styled.Text`
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 800;
  margin-left: auto;
`;

export const BackButton = styled.Pressable`
  align-items: center;
  justify-content: center;
`;

export const PanelScroll = styled.ScrollView`
  flex: 1;
`;

export const PanelBody = styled.View`
  flex: 1;
  min-height: 0;
`;

export const PanelLayer = styled.View`
  flex: 1;
  min-height: 0;
  gap: 6px;
`;

// 목록 위를 덮는 상세. 목록은 아래에 그대로 살아 있다.
export const DetailLayer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  gap: 6px;
  background-color: ${colors.surface};
`;

export const UnlocatedToggle = styled.Pressable`
  min-height: 44px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  padding: 0 4px;
  border-top-width: 1px;
  border-top-color: ${colors.border};
`;

export const UnlocatedToggleText = styled.Text`
  flex-shrink: 1;
  color: ${colors.textTertiary};
  font-size: 13px;
  font-weight: 700;
`;

export const PanelLoading = styled.View`
  flex: 1;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const PanelLoadingText = styled.Text`
  color: ${colors.textMuted};
  font-size: 13px;
  font-weight: 700;
`;

export const PlaceItem = styled.Pressable`
  gap: 4px;
  padding: 9px 0;
  border-bottom-width: 1px;
  border-bottom-color: #eef2f7;
`;

export const PlaceTitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const PlaceName = styled.Text`
  flex-shrink: 1;
  color: ${colors.text};
  font-size: 15px;
  font-weight: 800;
`;

export const MatchBadge = styled.View<{ $color: string }>`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 999px;
  border-width: 1px;
  border-color: ${({ $color }) => $color};
`;

export const MatchBadgeText = styled.Text<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: 11px;
  font-weight: 800;
`;

export const PlaceDistance = styled.Text`
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 700;
`;

export const PlaceAddress = styled.Text`
  color: ${colors.textTertiary};
  font-size: 13px;
  line-height: 18px;
`;

export const DetailAddress = styled.Text`
  color: ${colors.textTertiary};
  font-size: 13px;
  line-height: 18px;
`;

export const DetailDescription = styled.Text`
  color: ${colors.textSecondary};
  font-size: 13px;
  line-height: 18px;
`;

export const DetailMeta = styled.Text`
  color: ${colors.primary};
  font-size: 12px;
  font-weight: 700;
  text-align: right;
`;

export const ShelterItem = styled.View`
  gap: 5px;
  margin-bottom: 8px;
  padding: 10px;
  border-radius: 12px;
  background-color: #f8fafc;
  border-width: 1px;
  border-color: ${colors.border};
`;

export const ShelterImageFrame = styled.Pressable`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 10px;
  background-color: ${colors.border};
`;

export const ShelterImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const ImageNavButton = styled.Pressable<{ $position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $position }) => `${$position}: 8px;`}
  width: 30px;
  height: 30px;
  margin-top: -15px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.imageViewerControl};
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
  font-size: 10px;
  font-weight: 800;
`;

export const ImageModalOverlay = styled.Pressable`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${colors.imageViewerBackdrop};
`;

export const ImageModalContent = styled.Pressable`
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

export const ImageModalImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const ImageCloseButton = styled.Pressable`
  position: absolute;
  top: 46px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.68);
`;

export const ModalImageNavButton = styled.Pressable<{
  $position: 'left' | 'right';
}>`
  position: absolute;
  top: 50%;
  ${({ $position }) => `${$position}: 16px;`}
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.imageViewerControl};
`;

export const ModalImageCounter = styled.View`
  position: absolute;
  right: 16px;
  bottom: 32px;
  padding: 5px 10px;
  border-radius: 999px;
  background-color: rgba(17, 24, 39, 0.72);
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
  font-size: 10px;
  font-weight: 800;
`;

export const TypeCountChip = styled.View`
  padding: 5px 8px;
  border-radius: 999px;
  background-color: ${SHELTER_SELECTED_COLOR};
`;

export const TypeCountText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 11px;
  font-weight: 800;
`;

export const AccessChip = styled.View<{ $active: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 3px;
  padding: 5px 7px;
  border-radius: 999px;
  background-color: ${({ $active }) =>
    $active ? ACCESSIBILITY_SELECTED_COLOR : colors.surfaceMuted};
  border-width: 1px;
  border-color: ${({ $active }) =>
    $active ? ACCESSIBILITY_SELECTED_COLOR : colors.border};
`;

export const AccessChipText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) =>
    $active ? colors.textOnColor : colors.textDisabled};
  font-size: 10px;
  font-weight: 800;
`;

export const ReportButton = styled.Pressable`
  min-height: 38px;
  margin-top: 4px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  background-color: ${colors.primarySoft};
  border-width: 1px;
  border-color: ${colors.primaryBorder};
`;

export const ReportButtonText = styled.Text`
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 800;
`;

export const ReportDoneBadge = styled.View`
  min-height: 38px;
  margin-top: 4px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surfaceMuted};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const ReportDoneBadgeText = styled.Text`
  color: ${colors.textMuted};
  font-size: 13px;
  font-weight: 800;
`;

export const ReportLoginButton = styled.Pressable`
  min-height: 44px;
  margin-top: 4px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${colors.borderStrong};
  border-style: dashed;
`;

export const ReportLoginButtonText = styled.Text`
  color: ${colors.textTertiary};
  font-size: 13px;
  font-weight: 700;
`;

export const DirectionsButton = styled.Pressable`
  min-height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  background-color: ${colors.brand};
`;

export const DirectionsButtonText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 12px;
  font-weight: 800;
`;

export const DetailActionRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

export const SecondaryActionButton = styled.Pressable`
  min-height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  border-width: 1px;
  border-color: #c7d2fe;
  background-color: ${colors.surface};
`;

export const SecondaryActionButtonText = styled.Text`
  color: ${colors.brand};
  font-size: 12px;
  font-weight: 800;
`;

// 미리보기 띠. 패널과 같은 좌우 여백으로 패널 윗변 위에 뜬다.
export const PreviewStrip = styled(Animated.View)`
  position: absolute;
  left: 12px;
  right: 12px;
  height: ${PREVIEW_STRIP_HEIGHT}px;
`;

// 고른 핀과 같은 파란 선을 왼쪽에 둬서 어느 핀의 카드인지 보이게 한다.
export const PreviewCard = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: stretch;
  overflow: hidden;
  border-radius: 14px;
  border-left-width: 4px;
  border-left-color: ${colors.primary};
  background-color: ${colors.surface};
  shadow-color: ${colors.shadow};
  shadow-opacity: 0.16;
  shadow-radius: 10px;
  shadow-offset: 0 3px;
  elevation: 8;
`;

export const PreviewOpenButton = styled.Pressable`
  flex: 1;
  min-width: 0;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px 0 8px 12px;
`;

export const PreviewBody = styled.View`
  flex: 1;
  min-width: 0;
  gap: 3px;
`;

export const PreviewMeta = styled.Text`
  color: ${colors.primary};
  font-size: 12px;
  font-weight: 700;
`;

export const PreviewMore = styled.View`
  align-self: flex-end;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: 4px 6px 4px 10px;
  border-radius: 999px;
  background-color: ${colors.primary};
`;

export const PreviewMoreText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 12px;
  font-weight: 800;
`;

export const PreviewCloseButton = styled.Pressable`
  width: 44px;
  align-items: center;
  justify-content: center;
`;

export const ShelterContactRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

export const PhoneButton = styled.Pressable`
  min-height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  background-color: ${colors.primarySoft};
`;

export const PhoneButtonText = styled.Text`
  color: ${colors.primary};
  font-size: 12px;
  font-weight: 700;
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

export const ReportCloseButton = styled.Pressable`
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
`;

export const ReportShelterName = styled.Text`
  color: ${colors.textSecondary};
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
`;

export const ReportModalScroll = styled.ScrollView`
  flex: 1;
`;

export const ReportField = styled.View`
  gap: 8px;
  margin-bottom: 14px;
`;

export const ReportEtcField = styled.View`
  flex: 1;
  gap: 8px;
  margin-bottom: 14px;
`;

export const ReportLabel = styled.Text`
  color: ${colors.text};
  font-size: 13px;
  font-weight: 800;
`;

export const ReportTextArea = styled.TextInput`
  flex: 1;
  min-height: 104px;
  padding: 12px;
  border-radius: 10px;
  color: ${colors.text};
  font-size: 14px;
  line-height: 20px;
  background-color: ${colors.background};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const ReportToggleGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

export const ReportToggle = styled.Pressable<{ $active: boolean }>`
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active }) =>
    $active ? colors.primary : colors.surfaceMuted};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? colors.primary : colors.border)};
`;

export const ReportToggleText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) =>
    $active ? colors.textOnColor : colors.textTertiary};
  font-size: 12px;
  font-weight: 800;
`;

export const AddImageButton = styled.Pressable`
  min-height: 40px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  background-color: ${colors.primarySoft};
  border-width: 1px;
  border-color: ${colors.primaryBorder};
`;

export const AddImageButtonText = styled.Text`
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 800;
`;

export const ReportImageItem = styled.View`
  flex-direction: row;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background-color: ${colors.background};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const ReportImagePreview = styled.Image`
  width: 74px;
  height: 74px;
  border-radius: 10px;
  background-color: ${colors.border};
`;

export const ReportImageBody = styled.View`
  flex: 1;
  gap: 8px;
  min-width: 0;
`;

export const ReportImageTopRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const ReportImageName = styled.Text`
  flex: 1;
  color: ${colors.textSecondary};
  font-size: 12px;
  font-weight: 700;
`;

export const ReportImageRemoveButton = styled.Pressable`
  width: 28px;
  height: 28px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.dangerSoft};
`;

export const ReportCategoryRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
`;

export const ReportCategoryChip = styled.Pressable<{ $active: boolean }>`
  min-height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active }) =>
    $active ? colors.text : colors.surface};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? colors.text : colors.border)};
`;

export const ReportCategoryText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) =>
    $active ? colors.textOnColor : colors.textTertiary};
  font-size: 11px;
  font-weight: 800;
`;

export const ReportImageDescriptionInput = styled.TextInput`
  min-height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  color: ${colors.text};
  font-size: 12px;
  background-color: ${colors.surface};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const ReportSubmitButton = styled.Pressable`
  min-height: 46px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 7px;
  background-color: ${colors.primary};
`;

export const ReportSubmitText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 14px;
  font-weight: 800;
`;

export const EmptyList = styled.View`
  align-items: center;
  padding-bottom: 12px;
`;

export const EmptyPanelText = styled.Text`
  padding: 18px 0;
  color: ${colors.textMuted};
  font-size: 14px;
  text-align: center;
`;
