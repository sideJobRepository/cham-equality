import { useMemo, useState } from 'react';
import { Modal, type ImageSourcePropType } from 'react-native';
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
import {
  manualStyles,
  Screen,
  BannerFrame,
  BannerImage,
  SearchBox,
  SearchInput,
  IconButton,
  SearchButton,
  Board,
  BoardHeader,
  HeaderTitle,
  HeaderDate,
  ManualRow,
  ManualTitle,
  ManualDate,
  EmptyBox,
  EmptyText,
  Pagination,
  PageButton,
  PageText,
  ModalOverlay,
  ModalCard,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalMetaRow,
  ModalDate,
  ManualWebViewFrame,
  MapShortcutButton,
  MapShortcutText,
  MapShortcutIcon,
} from './ManualScreen.styles.ts';

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
                style={manualStyles.manualWebView}
              />
            </ManualWebViewFrame>
          </ModalCard>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
}
