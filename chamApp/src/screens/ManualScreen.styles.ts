import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/index.ts';

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

export const IconButton = styled.Pressable`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
`;

export const SearchButton = styled.Pressable`
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${colors.primary};
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
  font-size: 12px;
  font-weight: 700;
  color: #1d1d1f;
`;

export const ManualDate = styled.Text`
  width: 88px;
  text-align: center;
  font-size: 12px;
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

export const PageButton = styled.Pressable`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background-color: ${colors.surface};
  border-width: 1px;
  border-color: ${colors.border};
`;

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

export const CloseButton = styled.Pressable`
  width: 36px;
  height: 36px;
  margin-right: -8px;
  align-items: center;
  justify-content: center;
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
  background-color: ${colors.primary};
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
