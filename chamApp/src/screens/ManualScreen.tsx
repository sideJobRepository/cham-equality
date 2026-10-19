import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  type ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ChevronRight, CloudOff, Search, X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import {
  useFetchManualDetail,
  useFetchManuals,
} from '../services/manual.service.ts';
import { useManualStore } from '../store/manual.ts';
import type { RootTabParamList } from '../navigation/AppNavigator.tsx';
import IconButton from '../components/ui/IconButton.tsx';
import StatusMessage from '../components/ui/StatusMessage.tsx';
import { colors, radius } from '../theme/index.ts';
import {
  manualStyles,
  Screen,
  BannerFrame,
  BannerImage,
  SearchBox,
  SearchInput,
  BoardInset,
  BoardHeader,
  HeaderTitle,
  HeaderDate,
  ManualRow,
  ManualTitle,
  ManualDate,
  EmptyBox,
  EmptyText,
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
  const { t: translate } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const { fetchManuals, status: manualsStatus } = useFetchManuals(query);
  const fetchManualDetail = useFetchManualDetail();
  const manuals = useManualStore(state => state.manuals);
  const manualDetail = useManualStore(state => state.manualDetail);
  const clearManualDetail = useManualStore(state => state.clearManualDetail);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const listRef = useRef<FlatList<(typeof manuals)[number]>>(null);
  // source 객체가 렌더마다 새로 생기면 WebView 가 본문을 다시 읽는다.
  const manualDetailContent = manualDetail?.content;
  const manualDetailSource = useMemo(
    () => ({ html: buildManualHtml(manualDetailContent) }),
    [manualDetailContent],
  );

  // 오류면 옛 목록 대신 오류 안내를 보여야 하므로 비운다.
  const visibleManuals = manualsStatus === 'error' ? [] : manuals;

  // 탭 진입 때 자동 새로고침에도 status 가 loading 이 되므로, 당김 표시는 사용자가 당긴 경우만.
  const handlePullRefresh = () => {
    setPullRefreshing(true);
    fetchManuals().finally(() => setPullRefreshing(false));
  };

  const handlePressManual = (id: number) => {
    fetchManualDetail(id);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleSubmitSearch = () => {
    scrollToTop();
    setQuery(searchText.trim());
  };

  const handleClearSearch = () => {
    setSearchText('');
    scrollToTop();
    setQuery('');
  };

  const handleGoToMap = () => {
    clearManualDetail();
    navigation.navigate('Map');
  };

  return (
    <Screen>
      <FlatList
        ref={listRef}
        data={visibleManuals}
        keyExtractor={manual => String(manual.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={manualStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={handlePullRefresh}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        }
        ListHeaderComponent={
          <>
            <BannerFrame>
              <BannerImage source={manualBanner} resizeMode="contain" />
            </BannerFrame>

            <SearchBox>
              <SearchInput
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSubmitSearch}
                placeholder={translate('manual.searchPlaceholder')}
                placeholderTextColor={colors.textDisabled}
                returnKeyType="search"
              />
              {searchText ? (
                <IconButton
                  accessibilityLabel={translate('manual.clearSearch')}
                  onPress={handleClearSearch}
                >
                  <X color={colors.textMuted} size={18} strokeWidth={2.6} />
                </IconButton>
              ) : null}
              <IconButton
                accessibilityLabel={translate('manual.search')}
                backgroundColor={colors.brand}
                borderRadius={radius.sm}
                onPress={handleSubmitSearch}
              >
                <Search
                  color={colors.textOnColor}
                  size={18}
                  strokeWidth={2.6}
                />
              </IconButton>
            </SearchBox>

            <BoardInset>
              <BoardHeader>
                <HeaderTitle>{translate('manual.subject')}</HeaderTitle>
                <HeaderDate>{translate('manual.createdAt')}</HeaderDate>
              </BoardHeader>
            </BoardInset>
          </>
        }
        renderItem={({ item: manual }) => (
          <BoardInset>
            <ManualRow
              accessibilityRole="button"
              onPress={() => handlePressManual(manual.id)}
            >
              <ManualTitle numberOfLines={1} ellipsizeMode="tail">
                {manual.title}
              </ManualTitle>
              <ManualDate>{formatManualDate(manual.createDate)}</ManualDate>
            </ManualRow>
          </BoardInset>
        )}
        ListEmptyComponent={
          <BoardInset>
            {manualsStatus === 'error' ? (
              <StatusMessage
                tone="error"
                icon={CloudOff}
                message={translate('manual.loadFailed')}
                actionLabel={translate('common.retry')}
                onAction={fetchManuals}
              />
            ) : manualsStatus === 'loading' ? (
              <StatusMessage loading message={translate('manual.loading')} />
            ) : (
              <EmptyBox accessibilityLiveRegion="polite">
                <EmptyText>
                  {query
                    ? translate('manual.searchEmpty')
                    : translate('manual.empty')}
                </EmptyText>
              </EmptyBox>
            )}
          </BoardInset>
        }
      />

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
                accessibilityLabel={translate('common.close')}
                onPress={clearManualDetail}
              >
                <X color={colors.text} size={20} strokeWidth={2.7} />
              </CloseButton>
            </ModalHeader>
            <ModalMetaRow>
              <ModalDate>
                {formatManualDate(manualDetail?.createDate)}
              </ModalDate>
              <MapShortcutButton
                accessibilityRole="button"
                onPress={handleGoToMap}
              >
                <MapShortcutText numberOfLines={1}>
                  {translate('manual.goToMap')}
                </MapShortcutText>
                <MapShortcutIcon>
                  <ChevronRight
                    color={colors.textOnColor}
                    size={16}
                    strokeWidth={2.8}
                  />
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
