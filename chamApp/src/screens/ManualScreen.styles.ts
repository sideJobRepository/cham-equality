import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../components/ui/IconButton.tsx';
import { colors, fontSize } from '../theme/index.ts';

export const manualStyles = StyleSheet.create({
  manualWebView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.surface};
`;

export const BannerFrame = styled.View`
  width: 100%;
  aspect-ratio: 2.64;
  margin-bottom: 16px;
`;

export const BannerImage = styled.Image`
  width: 100%;
  height: 100%;
`;

export const SearchBox = styled.View`
  min-height: 46px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin: 0 12px 14px;
  padding: 0 8px 0 12px;
  border-radius: 8px;
  border-width: 1px;
  border-color: #dbeafe;
  background-color: #f8fbff;
`;

export const SearchInput = styled.TextInput`
  flex: 1;
  min-width: 0;
  color: ${colors.text};
  font-size: 14px;
  font-weight: 600;
`;

export const Board = styled.View`
  overflow: hidden;
  border-radius: 8px;
  border-color: ${colors.border};
  padding: 0 12px;
`;

export const BoardHeader = styled.View`
  min-height: 42px;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
  background-color: #edf5ff;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border};
`;

export const HeaderTitle = styled.Text`
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textMuted};
`;

export const HeaderDate = styled.Text`
  width: 88px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textMuted};
`;

export const ManualRow = styled.Pressable`
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
  border-bottom-width: 1px;
  border-bottom-color: #eef2f7;
  background-color: ${colors.surface};
`;

export const ManualTitle = styled.Text`
  flex: 1;
  //text-align: center;
  font-size: ${fontSize.body}px;
  font-weight: 700;
  color: #1d1d1f;
`;

export const ManualDate = styled.Text`
  width: 88px;
  text-align: center;
  font-size: ${fontSize.body}px;
  font-weight: 700;
  color: #1d1d1f;
`;

export const EmptyBox = styled.View`
  min-height: 160px;
  align-items: center;
  justify-content: center;
`;

export const EmptyText = styled.Text`
  color: ${colors.textMuted};
  font-size: 14px;
  font-weight: 700;
`;

export const Pagination = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 16px;
`;

// 페이지 버튼은 보이는 크기만 36. 터치 영역은 IconButton 이 hitSlop 으로 44를 채운다
export const PAGE_BUTTON_SIZE = 36;

export const PageText = styled.Text`
  min-width: 58px;
  text-align: center;
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 600;
`;

export const ModalOverlay = styled.Pressable`
  flex: 1;
  justify-content: center;
  padding: 20px;
  background-color: rgba(15, 23, 42, 0.45);
`;

export const ModalCard = styled.Pressable`
  height: 78%;
  padding: 18px;
  border-radius: 14px;
  background-color: ${colors.surface};
`;

export const ModalHeader = styled.View`
  min-height: 36px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

export const ModalTitle = styled.Text`
  flex: 1;
  color: ${colors.text};
  font-size: 18px;
  line-height: 24px;
  font-weight: 800;
`;

// 아이콘을 카드 오른쪽 여백선에 맞추려고 터치 영역만큼 바깥으로 민다
export const CloseButton = styled(IconButton)`
  margin-right: -12px;
`;

export const ModalMetaRow = styled.View`
  margin-top: 6px;
  padding-bottom: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border};
`;

export const ModalDate = styled.Text`
  flex: 1;
  min-width: 0;
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 600;
`;

export const ManualWebViewFrame = styled.View`
  flex: 1;
  width: 100%;
  margin-top: 14px;
  overflow: hidden;
  background-color: ${colors.surface};
`;

export const MapShortcutButton = styled.Pressable`
  padding: 8px 12px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 4px;
  background-color: ${colors.brand};
`;

export const MapShortcutText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 12px;
  font-weight: 600;
`;

export const MapShortcutIcon = styled.View`
  width: 16px;
  height: 16px;
  margin-top: 1px;
  align-items: center;
  justify-content: center;
`;
