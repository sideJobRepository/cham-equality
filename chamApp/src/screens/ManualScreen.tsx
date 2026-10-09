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
import IconButton from '../components/ui/IconButton.tsx';
import { colors, radius } from '../theme/index.ts';
import {
  manualStyles,
  Screen,
  BannerFrame,
  BannerImage,
  SearchBox,
  SearchInput,
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
  PAGE_BUTTON_SIZE,
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
          placeholderTextColor={colors.textDisabled}
          returnKeyType="search"
        />
        {searchText ? (
          <IconButton
            accessibilityLabel={t('manual.clearSearch')}
            onPress={handleClearSearch}
          >
            <X color={colors.textMuted} size={18} strokeWidth={2.6} />
          </IconButton>
        ) : null}
        <IconButton
          accessibilityLabel={t('manual.search')}
          backgroundColor={colors.brand}
          borderRadius={radius.sm}
          onPress={handleSubmitSearch}
        >
          <Search color={colors.textOnColor} size={18} strokeWidth={2.6} />
        </IconButton>
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
        <IconButton
          accessibilityLabel={t('common.prevPage')}
          visualSize={PAGE_BUTTON_SIZE}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          disabled={currentPage === 1}
          onPress={handlePrevPage}
        >
          <ChevronLeft
            color={currentPage === 1 ? colors.borderStrong : colors.text}
            size={16}
            strokeWidth={2.6}
          />
        </IconButton>
        <PageText>
          {currentPage} / {totalPages}
        </PageText>
        <IconButton
          accessibilityLabel={t('common.nextPage')}
          visualSize={PAGE_BUTTON_SIZE}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          disabled={currentPage === totalPages}
          onPress={handleNextPage}
        >
          <ChevronRight
            color={currentPage === totalPages ? colors.borderStrong : colors.text}
            size={16}
            strokeWidth={2.6}
          />
        </IconButton>
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
              <CloseButton
                accessibilityLabel={t('common.close')}
                onPress={clearManualDetail}
              >
                <X color={colors.text} size={20} strokeWidth={2.7} />
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
                  <ChevronRight color={colors.textOnColor} size={16} strokeWidth={2.8} />
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
