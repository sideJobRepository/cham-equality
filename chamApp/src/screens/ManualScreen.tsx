import { useMemo, useState } from 'react';
import { Modal, StyleSheet, type ImageSourcePropType } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import {
  useFetchManualDetail,
  useFetchManuals,
} from '../services/manual.service.ts';
import { useManualStore } from '../store/manual.ts';
import type { RootTabParamList } from '../navigation/AppNavigator.tsx';

const PAGE_SIZE = 10;
const manualBanner =
  require('../assets/images/manual.png') as ImageSourcePropType;

function formatManualDate(dateString?: string) {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

function buildManualHtml(content?: string) {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 0;
        color: #1d1d1f;
        font-size: 15px;
        line-height: 1.65;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        word-break: break-word;
      }
      img, video, iframe {
        max-width: 100%;
        height: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
    </style>
  </head>
  <body>${content ?? ''}</body>
</html>`;
}

export default function ManualScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  useFetchManuals(query);
  const fetchManualDetail = useFetchManualDetail();
  const manuals = useManualStore(state => state.manuals);
  const manualDetail = useManualStore(state => state.manualDetail);
  const clearManualDetail = useManualStore(state => state.clearManualDetail);
  const [page, setPage] = useState(1);
  // source 객체가 렌더마다 새로 생기면 WebView 가 본문을 다시 읽는다.
  const manualDetailContent = manualDetail?.content;
  const manualDetailSource = useMemo(
    () => ({ html: buildManualHtml(manualDetailContent) }),
    [manualDetailContent],
  );

  const totalPages = Math.max(1, Math.ceil(manuals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedManuals = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return manuals.slice(start, start + PAGE_SIZE);
  }, [currentPage, manuals]);

  const handlePrevPage = () => {
    setPage(value => Math.max(value - 1, 1));
  };

  const handleNextPage = () => {
    setPage(value => Math.min(value + 1, totalPages));
  };

  const handlePressManual = (id: number) => {
    fetchManualDetail(id);
  };

  const handleSubmitSearch = () => {
    setPage(1);
    setQuery(searchText.trim());
  };

  const handleClearSearch = () => {
    setSearchText('');
    setPage(1);
    setQuery('');
  };

  const handleGoToMap = () => {
    clearManualDetail();
    navigation.navigate('Map');
  };

  return (
    <Screen>
      <BannerFrame>
        <BannerImage source={manualBanner} resizeMode="contain" />
      </BannerFrame>

      <SearchBox>
        <SearchInput
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSubmitSearch}
          placeholder={t('manual.searchPlaceholder')}
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
        />
        {searchText ? (
          <IconButton onPress={handleClearSearch}>
            <X color="#6b7280" size={18} strokeWidth={2.6} />
          </IconButton>
        ) : null}
        <SearchButton onPress={handleSubmitSearch}>
          <Search color="#ffffff" size={18} strokeWidth={2.6} />
        </SearchButton>
      </SearchBox>

      <Board>
        <BoardHeader>
          <HeaderTitle>{t('manual.subject')}</HeaderTitle>
          <HeaderDate>{t('manual.createdAt')}</HeaderDate>
        </BoardHeader>

        {pagedManuals.length ? (
          pagedManuals.map(manual => (
            <ManualRow
              key={manual.id}
              onPress={() => handlePressManual(manual.id)}
            >
              <ManualTitle numberOfLines={1} ellipsizeMode="tail">
                {manual.title}
              </ManualTitle>
              <ManualDate>{formatManualDate(manual.createDate)}</ManualDate>
            </ManualRow>
          ))
        ) : (
          <EmptyBox>
            <EmptyText>
              {query ? t('manual.searchEmpty') : t('manual.empty')}
            </EmptyText>
          </EmptyBox>
        )}
      </Board>

      <Pagination>
        <PageButton disabled={currentPage === 1} onPress={handlePrevPage}>
          <ChevronLeft
            color={currentPage === 1 ? '#d1d5db' : '#111827'}
            size={16}
            strokeWidth={2.6}
          />
        </PageButton>
        <PageText>
          {currentPage} / {totalPages}
        </PageText>
        <PageButton
          disabled={currentPage === totalPages}
          onPress={handleNextPage}
        >
          <ChevronRight
            color={currentPage === totalPages ? '#d1d5db' : '#111827'}
            size={16}
            strokeWidth={2.6}
          />
        </PageButton>
      </Pagination>

      <Modal
        animationType="fade"
        transparent
        visible={!!manualDetail}
        onRequestClose={clearManualDetail}
      >
        <ModalOverlay onPress={clearManualDetail}>
          <ModalCard onPress={event => event.stopPropagation()}>
            <ModalHeader>
              <ModalTitle numberOfLines={2}>{manualDetail?.title}</ModalTitle>
              <CloseButton onPress={clearManualDetail}>
                <X color="#111827" size={20} strokeWidth={2.7} />
              </CloseButton>
            </ModalHeader>
            <ModalMetaRow>
              <ModalDate>
                {formatManualDate(manualDetail?.createDate)}
              </ModalDate>
              <MapShortcutButton onPress={handleGoToMap}>
                <MapShortcutText numberOfLines={1}>
                  {t('manual.goToMap')}
                </MapShortcutText>
                <MapShortcutIcon>
                  <ChevronRight color="#ffffff" size={16} strokeWidth={2.8} />
                </MapShortcutIcon>
              </MapShortcutButton>
            </ModalMetaRow>
            <ManualWebViewFrame>
              <WebView
                originWhitelist={['*']}
                source={manualDetailSource}
                javaScriptEnabled
                domStorageEnabled
                nestedScrollEnabled
                style={styles.manualWebView}
              />
            </ManualWebViewFrame>
          </ModalCard>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  manualWebView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: #ffffff;
`;

const BannerFrame = styled.View`
  width: 100%;
  aspect-ratio: 2.64;
  margin-bottom: 16px;
`;

const BannerImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const SearchBox = styled.View`
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

const SearchInput = styled.TextInput`
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
`;

const IconButton = styled.Pressable`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
`;

const SearchButton = styled.Pressable`
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #2563eb;
`;

const Board = styled.View`
  overflow: hidden;
  border-radius: 8px;
  border-color: #e5e7eb;
  padding: 0 12px;
`;

const BoardHeader = styled.View`
  min-height: 42px;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
  background-color: #edf5ff;
  border-bottom-width: 1px;
  border-bottom-color: #e5e7eb;
`;

const HeaderTitle = styled.Text`
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
`;

const HeaderDate = styled.Text`
  width: 88px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
`;

const ManualRow = styled.Pressable`
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
  border-bottom-width: 1px;
  border-bottom-color: #eef2f7;
  background-color: #ffffff;
`;

const ManualTitle = styled.Text`
  flex: 1;
  //text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #1d1d1f;
`;

const ManualDate = styled.Text`
  width: 88px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #1d1d1f;
`;

const EmptyBox = styled.View`
  min-height: 160px;
  align-items: center;
  justify-content: center;
`;

const EmptyText = styled.Text`
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
`;

const Pagination = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 16px;
`;

const PageButton = styled.Pressable`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background-color: #ffffff;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const PageText = styled.Text`
  min-width: 58px;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
`;

const ModalOverlay = styled.Pressable`
  flex: 1;
  justify-content: center;
  padding: 20px;
  background-color: rgba(15, 23, 42, 0.45);
`;

const ModalCard = styled.Pressable`
  height: 78%;
  padding: 18px;
  border-radius: 14px;
  background-color: #ffffff;
`;

const ModalHeader = styled.View`
  min-height: 36px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const ModalTitle = styled.Text`
  flex: 1;
  color: #111827;
  font-size: 18px;
  line-height: 24px;
  font-weight: 800;
`;

const CloseButton = styled.Pressable`
  width: 36px;
  height: 36px;
  margin-right: -8px;
  align-items: center;
  justify-content: center;
`;

const ModalMetaRow = styled.View`
  margin-top: 6px;
  padding-bottom: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom-width: 1px;
  border-bottom-color: #e5e7eb;
`;

const ModalDate = styled.Text`
  flex: 1;
  min-width: 0;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
`;

const ManualWebViewFrame = styled.View`
  flex: 1;
  width: 100%;
  margin-top: 14px;
  overflow: hidden;
  background-color: #ffffff;
`;

const MapShortcutButton = styled.Pressable`
  padding: 8px 12px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 4px;
  background-color: #2563eb;
`;

const MapShortcutText = styled.Text`
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
`;

const MapShortcutIcon = styled.View`
  width: 16px;
  height: 16px;
  margin-top: 1px;
  align-items: center;
  justify-content: center;
`;
