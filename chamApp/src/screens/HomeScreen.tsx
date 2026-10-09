import { useEffect, useState } from 'react';
import { Linking, Modal, type ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudOff,
  Info,
  MapPin,
  MapPinOff,
  SearchX,
  ShieldCheck,
  Siren,
  Square,
  TriangleAlert,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import CurrentLocationBar from '../components/CurrentLocationBar.tsx';
import LanguageButton from '../components/LanguageButton.tsx';
import MapSearchFilters from '../components/MapSearchFilters.tsx';
import FullscreenImageViewer from '../components/ui/FullscreenImageViewer.tsx';
import Button from '../components/ui/Button.tsx';
import IconButton from '../components/ui/IconButton.tsx';
import StatusMessage from '../components/ui/StatusMessage.tsx';
import AccessibilityChip from '../components/shelter/AccessibilityChip.tsx';
import ShelterNoPhotoBanner from '../components/shelter/ShelterNoPhotoBanner.tsx';
import {
  loadCurrentLocation,
  useCurrentLocation,
} from '../hooks/useCurrentLocation.ts';
import { useFetchSMS } from '../services/sms.service.ts';
import { useFetchNearestShelter } from '../services/map.service.ts';
import {
  useContentStore,
  useDisasterStore,
  useLocationStore,
  useNearestShelterStore,
  usePushStore,
  useSMSStore,
  useSplashStore,
} from '../store';
import type { NearestShelter } from '../store/nearestShelter.ts';
import {
  shelterTypeLabelMap,
  shelterTypeTranslationKeys,
} from '../store/mapFilters.ts';
import { useFetchDisaster } from '../services/disaster.service.ts';
import type { RootTabParamList } from '../navigation/AppNavigator.tsx';
import { useFetchContents } from '../services/content.service.ts';
import { colors } from '../theme/index.ts';
import { getAccessibilityChips } from '../utils/shelterLabels.ts';
import {
  Screen,
  HomeScroll,
  TopSection,
  MiddleSection,
  ShelterItem,
  ShelterStatusBox,
  ShelterImageFrame,
  ShelterImage,
  ImageNavButton,
  IMAGE_NAV_SIZE,
  ImageCounter,
  ImageCounterText,
  ShelterTitleRow,
  ShelterName,
  ShelterMetaRow,
  ShelterMetaIconText,
  ShelterMetaText,
  ShelterMeta,
  ChipRow,
  TypeChip,
  TypeChipText,
  LanguageRow,
  MessageBox,
  MessageStepBar,
  MessageTextBox,
  MessageMetaRow,
  MessageStepLabel,
  MessageAgoText,
  MessageTitle,
  MessageBox2,
  TopBox,
  SummaryRow,
  SummaryDot,
  MessageTitle2,
  TimeText,
  CenterBox,
  SummaryText,
  DisasterMoreButton,
  DisasterMoreText,
  ModalOverlay,
  NoticeModalCard,
  NoticeModalHeader,
  NoticeModalCategory,
  NoticeImage,
  NoticeContent,
  NoticeButtonRow,
  SMSCard,
  SMSHeader,
  SMSStepText,
  SMSCategoryChip,
  SMSCategoryText,
  SMSHeaderSpacer,
  SMSBody,
  SMSMetaRow,
  SMSMetaText,
  SMSContentBox,
  SMSContentScroll,
  SMSContentText,
  SMSPager,
  SMSPagerText,
  SMSActions,
} from './HomeScreen.styles.ts';

function getShelterTypeLabel(type?: string) {
  if (!type) return 'map.labels.unknownType';
  return shelterTypeLabelMap[type] ?? type;
}

function getShelterTypeTranslationKey(type?: string) {
  if (!type) return null;
  return shelterTypeTranslationKeys[type] ?? null;
}

function getNearestShelterImageSources(
  shelter: NearestShelter,
): ImageSourcePropType[] {
  const sources =
    shelter.images
      ?.map(image => image.url)
      .filter((url): url is string => typeof url === 'string' && !!url.trim())
      .map(url => ({ uri: url })) ?? [];

  return sources;
}

function formatDisasterDate(dateString?: string) {
  if (!dateString) return '';

  //일일재난 날짜계산
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${month}.${day}`;
}

type SMSStepKey = 'CRITICAL' | 'EMERGENCY' | 'ADVISORY' | 'ETC';

// 긴급단계별 색·아이콘. 정부 재난문자 체계(위급 > 긴급 > 안전안내)의 심각도를 한눈에 구분하게 한다.
const SMS_STEPS: Record<SMSStepKey, { color: string; Icon: LucideIcon }> = {
  CRITICAL: { color: colors.alert.critical, Icon: Siren },
  EMERGENCY: { color: colors.alert.emergency, Icon: TriangleAlert },
  ADVISORY: { color: colors.alert.advisory, Icon: Info },
  ETC: { color: colors.alert.etc, Icon: Info },
};

function toSMSStepKey(step?: string): SMSStepKey {
  return step === 'CRITICAL' || step === 'EMERGENCY' || step === 'ADVISORY'
    ? step
    : 'ETC';
}

/** "12분 전" 같은 상대 시각. 재난문자는 얼마나 최근인지가 중요하다. */
function formatSMSAgo(dateString: string, translate: TFunction) {
  const time = new Date(dateString).getTime();
  if (Number.isNaN(time)) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return translate('home.smsJustNow');
  if (minutes < 60) return translate('home.smsMinutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate('home.smsHoursAgo', { count: hours });
  return translate('home.smsDaysAgo', { count: Math.floor(hours / 24) });
}

/** 여러 지역에 함께 발송된 문자는 콤마로 이어져 온다. 첫 지역 + "외 N곳"으로 줄인다. */
function formatSMSRegion(regionName: string, translate: TFunction) {
  const regions = regionName
    .split(',')
    .map(region => region.trim())
    .filter(Boolean);
  if (regions.length <= 1) return regions[0] ?? regionName;
  return translate('home.smsRegionMore', {
    region: regions[0],
    count: regions.length - 1,
  });
}

function formatSMSDateTime(dateString?: string) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${month}.${day} ${hours}:${minutes}`;
}

export default function HomeScreen() {
  const { t: translate } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  useCurrentLocation();
  useFetchSMS();
  useFetchDisaster();
  const fetchNearestShelter = useFetchNearestShelter();
  useFetchContents();
  const smsData = useSMSStore(state => state.sms);
  const contents = useContentStore(state => state.contents);
  const disasterData = useDisasterStore(state => state.disaster);
  const nearestShelter = useNearestShelterStore(state => state.nearestShelter);
  const nearestShelterStatus = useNearestShelterStore(state => state.status);
  const locationStatus = useLocationStore(state => state.status);
  const splashDone = useSplashStore(state => state.done);
  const popupContent =
    contents.find(content => content.contentType === 'IN_APP_POPUP') ?? null;
  const disasterSummary = disasterData?.summary?.slice(0, 3) ?? [];
  const disasterDate = formatDisasterDate(disasterData?.createDate);
  const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
  const [dismissedNoticeId, setDismissedNoticeId] = useState<number | null>(
    null,
  );
  const [isSMSModalVisible, setIsSMSModalVisible] = useState(false);
  const [selectedSMSIndex, setSelectedSMSIndex] = useState(0);
  const [shelterImageIndex, setShelterImageIndex] = useState(0);
  const [imageModal, setImageModal] = useState<{
    images: ImageSourcePropType[];
    index: number;
  } | null>(null);
  const selectedSMS = smsData[selectedSMSIndex];
  const smsStepKey = toSMSStepKey(selectedSMS?.emergencyStep);
  const smsStep = SMS_STEPS[smsStepKey];
  const latestSMS = smsData[0]?.content ? smsData[0] : undefined;
  const latestStepKey = toSMSStepKey(latestSMS?.emergencyStep);
  const latestStep = SMS_STEPS[latestStepKey];
  const latestStepLabel = translate(`home.smsStep.${latestStepKey}`);
  const latestAgo = latestSMS?.issuedAt
    ? formatSMSAgo(latestSMS.issuedAt, translate)
    : '';
  const nearestShelterImages = nearestShelter
    ? getNearestShelterImageSources(nearestShelter)
    : [];
  const nearestShelterImageIndex = nearestShelterImages.length
    ? Math.min(shelterImageIndex, nearestShelterImages.length - 1)
    : 0;
  const nearestShelterTypeLabel = nearestShelter
    ? translate(
        getShelterTypeTranslationKey(nearestShelter.shelterType) ??
          getShelterTypeLabel(nearestShelter.shelterType),
      )
    : '';
  const handlePressDisaster = () => {
    if (!disasterData?.originUrl) return;
    Linking.openURL(disasterData.originUrl);
  };
  const handlePressNearestShelter = () => {
    if (!nearestShelter) return;

    navigation.navigate('Map', {
      focusPlaceId: nearestShelter.placeId ?? undefined,
      focusShelterId: nearestShelter.shelterId,
      focusNonce: Date.now(),
    });
  };
  const handleRequestLocation = async () => {
    const result = await loadCurrentLocation();
    // '다시 묻지 않음'이면 권한 창이 안 뜨므로 설정 화면으로 보낸다.
    if (result === 'blocked') Linking.openSettings().catch(() => undefined);
  };
  const renderNearestShelterStatus = () => {
    if (locationStatus === 'denied') {
      return (
        <StatusMessage
          compact
          icon={MapPinOff}
          message={translate('home.locationDenied')}
          actionLabel={translate('home.allowLocation')}
          onAction={handleRequestLocation}
        />
      );
    }
    if (locationStatus === 'unavailable') {
      return (
        <StatusMessage
          compact
          icon={MapPinOff}
          message={translate('home.locationUnavailable')}
          actionLabel={translate('common.retry')}
          onAction={handleRequestLocation}
        />
      );
    }
    if (nearestShelterStatus === 'empty') {
      return (
        <StatusMessage
          compact
          icon={SearchX}
          message={translate('home.noNearbyShelter')}
          actionLabel={translate('home.viewMap')}
          onAction={() => navigation.navigate('Map')}
        />
      );
    }
    if (nearestShelterStatus === 'error') {
      return (
        <StatusMessage
          compact
          tone="error"
          icon={CloudOff}
          message={translate('home.shelterLoadFailed')}
          actionLabel={translate('common.retry')}
          onAction={fetchNearestShelter}
        />
      );
    }
    // 위치 확인 중이거나 첫 요청 전·요청 중
    return (
      <StatusMessage
        compact
        loading
        message={translate('home.shelterLoading')}
      />
    );
  };
  const closeNoticeModal = () => {
    if (popupContent) setDismissedNoticeId(popupContent.id);
    setIsNoticeModalVisible(false);
  };
  const handlePressNoticeLink = () => {
    if (!popupContent?.url) return;
    Linking.openURL(popupContent.url);
  };

  // 재난문자 푸시를 눌러 들어오면 그 문자의 상세를 연다.
  // 목록(최신 5건)에 없으면 가장 최근 문자로 대신 연다.
  const openMessageId = usePushStore(state => state.openMessageId);
  const clearOpenMessage = usePushStore(state => state.clearOpen);
  useEffect(() => {
    if (openMessageId == null || !splashDone || smsData.length === 0) return;
    const index = smsData.findIndex(item => item.id === openMessageId);
    setSelectedSMSIndex(Math.max(index, 0));
    setIsSMSModalVisible(true);
    clearOpenMessage();
  }, [clearOpenMessage, openMessageId, smsData, splashDone]);

  useEffect(() => {
    // 스플래시가 걷히기 전에 띄우면 스플래시 위로 팝업이 먼저 튀어나온다.
    if (!splashDone) return;
    if (!popupContent || dismissedNoticeId === popupContent.id) return;
    setIsNoticeModalVisible(true);
  }, [dismissedNoticeId, popupContent, splashDone]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <HomeScroll showsVerticalScrollIndicator={false}>
        <TopSection>
          <LanguageRow>
            <LanguageButton />
          </LanguageRow>

          {latestSMS ? (
            <MessageBox
              accessibilityRole="button"
              accessibilityLabel={`${latestStepLabel}, ${latestSMS.content}`}
              accessibilityHint={latestAgo || undefined}
              onPress={() => {
                setSelectedSMSIndex(0);
                setIsSMSModalVisible(true);
              }}
            >
              <MessageStepBar $color={latestStep.color} />
              <latestStep.Icon
                color={latestStep.color}
                size={24}
                strokeWidth={2.4}
              />
              <MessageTextBox>
                <MessageMetaRow>
                  <MessageStepLabel $color={latestStep.color}>
                    {latestStepLabel}
                  </MessageStepLabel>
                  {latestAgo ? (
                    <MessageAgoText>{latestAgo}</MessageAgoText>
                  ) : null}
                </MessageMetaRow>
                {/* 위급·긴급은 한 줄로 자르면 핵심 지시가 잘려서 두 줄까지 보여준다 */}
                <MessageTitle
                  numberOfLines={
                    latestStepKey === 'CRITICAL' ||
                    latestStepKey === 'EMERGENCY'
                      ? 2
                      : 1
                  }
                  ellipsizeMode="tail"
                >
                  {latestSMS.content}
                </MessageTitle>
              </MessageTextBox>
            </MessageBox>
          ) : (
            <MessageBox
              disabled
              accessibilityRole="text"
              accessibilityLabel={translate('home.noActiveDisaster')}
            >
              <MessageStepBar $color={colors.success} />
              <ShieldCheck color={colors.success} size={24} strokeWidth={2.4} />
              <MessageTextBox>
                <MessageTitle numberOfLines={2} ellipsizeMode="tail">
                  {translate('home.noActiveDisaster')}
                </MessageTitle>
              </MessageTextBox>
            </MessageBox>
          )}
          <MessageBox2>
            <TopBox>
              <MessageTitle2 numberOfLines={1} ellipsizeMode="tail">
                {translate('home.messageTitle2')}
              </MessageTitle2>
              <TimeText>{disasterDate}</TimeText>
            </TopBox>
            <CenterBox>
              {disasterSummary.map((item, index) => (
                <SummaryRow key={`${index}-${item}`}>
                  <SummaryDot />
                  <SummaryText>{item}</SummaryText>
                </SummaryRow>
              ))}
            </CenterBox>
            {disasterData?.originUrl ? (
              <DisasterMoreButton
                accessibilityRole="link"
                onPress={handlePressDisaster}
              >
                <DisasterMoreText>{translate('home.more')}</DisasterMoreText>
              </DisasterMoreButton>
            ) : null}
          </MessageBox2>
        </TopSection>
        <MiddleSection>
          <CurrentLocationBar />
          <MapSearchFilters
            horizontalPadding={0}
            showShelterTypes={false}
            showAccessibilityAll={false}
          />
          {nearestShelter ? (
            <ShelterItem onPress={handlePressNearestShelter}>
              {nearestShelterImages.length ? (
                <ShelterImageFrame
                  accessibilityRole="imagebutton"
                  accessibilityLabel={translate('map.a11y.viewImage')}
                  onPress={event => {
                    event.stopPropagation();
                    setImageModal({
                      images: nearestShelterImages,
                      index: nearestShelterImageIndex,
                    });
                  }}
                >
                  <ShelterImage
                    source={nearestShelterImages[nearestShelterImageIndex]}
                    resizeMode="cover"
                  />
                  {nearestShelterImages.length > 1 ? (
                    <>
                      <ImageNavButton
                        $position="left"
                        visualSize={IMAGE_NAV_SIZE}
                        backgroundColor={colors.imageViewerControl}
                        accessibilityLabel={translate('common.previousImage')}
                        onPress={event => {
                          event.stopPropagation();
                          setShelterImageIndex(
                            index =>
                              (index - 1 + nearestShelterImages.length) %
                              nearestShelterImages.length,
                          );
                        }}
                      >
                        <ChevronLeft
                          color={colors.textOnColor}
                          size={18}
                          strokeWidth={2.8}
                        />
                      </ImageNavButton>
                      <ImageNavButton
                        $position="right"
                        visualSize={IMAGE_NAV_SIZE}
                        backgroundColor={colors.imageViewerControl}
                        accessibilityLabel={translate('common.nextImage')}
                        onPress={event => {
                          event.stopPropagation();
                          setShelterImageIndex(
                            index => (index + 1) % nearestShelterImages.length,
                          );
                        }}
                      >
                        <ChevronRight
                          color={colors.textOnColor}
                          size={18}
                          strokeWidth={2.8}
                        />
                      </ImageNavButton>
                      <ImageCounter>
                        <ImageCounterText>
                          {nearestShelterImageIndex + 1}/
                          {nearestShelterImages.length}
                        </ImageCounterText>
                      </ImageCounter>
                    </>
                  ) : null}
                </ShelterImageFrame>
              ) : (
                <ShelterNoPhotoBanner typeLabel={nearestShelterTypeLabel} />
              )}
              <ShelterTitleRow>
                <ShelterName>{nearestShelter.name}</ShelterName>
                <TypeChip>
                  <TypeChipText>{nearestShelterTypeLabel}</TypeChipText>
                </TypeChip>
              </ShelterTitleRow>
              <ShelterMetaRow>
                {typeof nearestShelter.capacity === 'number' ? (
                  <ShelterMetaIconText>
                    <Users
                      color={colors.textTertiary}
                      size={14}
                      strokeWidth={2.4}
                    />
                    <ShelterMetaText>
                      {nearestShelter.capacity.toLocaleString()}
                    </ShelterMetaText>
                  </ShelterMetaIconText>
                ) : null}
                {typeof nearestShelter.area === 'number' ? (
                  <ShelterMetaIconText>
                    <Square
                      color={colors.textTertiary}
                      size={13}
                      strokeWidth={2.4}
                    />
                    <ShelterMetaText>
                      {nearestShelter.area.toLocaleString()}㎡
                    </ShelterMetaText>
                  </ShelterMetaIconText>
                ) : null}
                {typeof nearestShelter.capacity !== 'number' &&
                typeof nearestShelter.area !== 'number' ? (
                  <ShelterMetaText>
                    {translate('home.noScaleInfo')}
                  </ShelterMetaText>
                ) : null}
              </ShelterMetaRow>
              <ShelterMeta>
                {[
                  nearestShelter.managingAuthorityName,
                  nearestShelter.managingAuthorityTelNo,
                ]
                  .filter(Boolean)
                  .join(' · ') || translate('home.noManagingAuthority')}
              </ShelterMeta>
              <ChipRow>
                {getAccessibilityChips(nearestShelter).map(chip => (
                  <AccessibilityChip
                    key={`${nearestShelter.shelterId}-${chip.key}`}
                    label={translate(chip.labelKey)}
                    active={chip.active}
                  />
                ))}
              </ChipRow>
            </ShelterItem>
          ) : (
            <ShelterStatusBox>{renderNearestShelterStatus()}</ShelterStatusBox>
          )}
        </MiddleSection>
      </HomeScroll>
      <Modal
        animationType="fade"
        transparent
        visible={!!popupContent && isNoticeModalVisible}
        onRequestClose={closeNoticeModal}
      >
        <ModalOverlay onPress={closeNoticeModal}>
          <NoticeModalCard onPress={event => event.stopPropagation()}>
            <NoticeModalHeader>
              <NoticeModalCategory>{popupContent?.name}</NoticeModalCategory>
              <IconButton
                accessibilityLabel={translate('common.close')}
                onPress={closeNoticeModal}
              >
                <X color={colors.textMuted} size={22} strokeWidth={2.6} />
              </IconButton>
            </NoticeModalHeader>
            {popupContent?.imageUrl ? (
              <NoticeImage source={{ uri: popupContent.imageUrl }} />
            ) : null}
            {/*<NoticeTitle>{popupContent?.name}</NoticeTitle>*/}
            {popupContent?.additionalInfo ? (
              <NoticeContent>{popupContent.additionalInfo}</NoticeContent>
            ) : null}
            <NoticeButtonRow>
              {popupContent?.url ? (
                <Button
                  label={translate('home.noticeDetail')}
                  onPress={handlePressNoticeLink}
                  accessibilityRole="link"
                  flex
                />
              ) : null}
              <Button
                label={translate('common.close')}
                onPress={closeNoticeModal}
                variant="secondary"
              />
            </NoticeButtonRow>
          </NoticeModalCard>
        </ModalOverlay>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={isSMSModalVisible}
        onRequestClose={() => setIsSMSModalVisible(false)}
      >
        <ModalOverlay onPress={() => setIsSMSModalVisible(false)}>
          <SMSCard onPress={event => event.stopPropagation()}>
            <SMSHeader style={{ backgroundColor: smsStep.color }}>
              <smsStep.Icon
                color={colors.textOnColor}
                size={22}
                strokeWidth={2.4}
              />
              <SMSStepText>
                {translate(`home.smsStep.${smsStepKey}`)}
              </SMSStepText>
              {selectedSMS?.category ? (
                <SMSCategoryChip>
                  <SMSCategoryText numberOfLines={1}>
                    {selectedSMS.category}
                  </SMSCategoryText>
                </SMSCategoryChip>
              ) : null}
              <SMSHeaderSpacer />
              <IconButton
                accessibilityLabel={translate('common.close')}
                onPress={() => setIsSMSModalVisible(false)}
              >
                <X color={colors.textOnColor} size={22} strokeWidth={2.4} />
              </IconButton>
            </SMSHeader>

            <SMSBody>
              {selectedSMS?.regionName ? (
                <SMSMetaRow>
                  <MapPin
                    color={colors.textMuted}
                    size={16}
                    strokeWidth={2.2}
                  />
                  <SMSMetaText numberOfLines={1}>
                    {formatSMSRegion(selectedSMS.regionName, translate)}
                  </SMSMetaText>
                </SMSMetaRow>
              ) : null}
              {selectedSMS?.issuedAt ? (
                <SMSMetaRow>
                  <Clock color={colors.textMuted} size={16} strokeWidth={2.2} />
                  <SMSMetaText>
                    {formatSMSAgo(selectedSMS.issuedAt, translate)} ·{' '}
                    {formatSMSDateTime(selectedSMS.issuedAt)}
                  </SMSMetaText>
                </SMSMetaRow>
              ) : null}
              <SMSContentBox style={{ borderLeftColor: smsStep.color }}>
                <SMSContentScroll>
                  <SMSContentText>
                    {selectedSMS?.content ?? translate('home.noSms')}
                  </SMSContentText>
                </SMSContentScroll>
              </SMSContentBox>

              {smsData.length > 1 ? (
                <SMSPager>
                  <IconButton
                    accessibilityLabel={translate('home.smsPrev')}
                    disabled={selectedSMSIndex === 0}
                    onPress={() =>
                      setSelectedSMSIndex(index => Math.max(index - 1, 0))
                    }
                  >
                    <ChevronLeft
                      color={
                        selectedSMSIndex === 0
                          ? colors.borderStrong
                          : colors.text
                      }
                      size={22}
                      strokeWidth={2.5}
                    />
                  </IconButton>
                  <SMSPagerText>
                    {selectedSMSIndex + 1} / {smsData.length}
                  </SMSPagerText>
                  <IconButton
                    accessibilityLabel={translate('home.smsNext')}
                    disabled={selectedSMSIndex >= smsData.length - 1}
                    onPress={() =>
                      setSelectedSMSIndex(index =>
                        Math.min(index + 1, smsData.length - 1),
                      )
                    }
                  >
                    <ChevronRight
                      color={
                        selectedSMSIndex >= smsData.length - 1
                          ? colors.borderStrong
                          : colors.text
                      }
                      size={22}
                      strokeWidth={2.5}
                    />
                  </IconButton>
                </SMSPager>
              ) : null}

              <SMSActions>
                <Button
                  label={translate('home.smsFindShelter')}
                  onPress={() => {
                    setIsSMSModalVisible(false);
                    if (nearestShelter) handlePressNearestShelter();
                    else navigation.navigate('Map');
                  }}
                  flex
                />
                <Button
                  label={translate('common.close')}
                  onPress={() => setIsSMSModalVisible(false)}
                  variant="secondary"
                />
              </SMSActions>
            </SMSBody>
          </SMSCard>
        </ModalOverlay>
      </Modal>
      <FullscreenImageViewer value={imageModal} onChange={setImageModal} />
    </Screen>
  );
}
