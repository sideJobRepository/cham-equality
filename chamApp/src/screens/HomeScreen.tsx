import { useEffect, useState } from 'react';
import { Linking, Modal, type ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MapPin,
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
import MapSearchFilters from '../components/MapSearchFilters.tsx';
import FullscreenImageViewer from '../components/ui/FullscreenImageViewer.tsx';
import { useCurrentLocation } from '../hooks/useCurrentLocation.ts';
import SpeakerIcon from '../assets/icons/SpeakerIcon';
import { useFetchSMS } from '../services/sms.service.ts';
import { useFetchNearestShelter } from '../services/map.service.ts';
import {
  useContentStore,
  useDisasterStore,
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
  ShelterImageFrame,
  ShelterImage,
  ImageNavButton,
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
  AccessChip,
  AccessChipText,
  LanguageRow,
  LanguageButton,
  LanguageText,
  MessageBox,
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
  NoticeCloseButton,
  NoticeImage,
  NoticeContent,
  NoticeButtonRow,
  NoticeButton,
  NoticePrimaryButton,
  NoticePrimaryButtonText,
  IconButton,
  ModalButtonText,
  SMSCard,
  SMSHeader,
  SMSStepText,
  SMSCategoryChip,
  SMSCategoryText,
  SMSHeaderSpacer,
  SMSCloseButton,
  SMSBody,
  SMSMetaRow,
  SMSMetaText,
  SMSContentBox,
  SMSContentScroll,
  SMSContentText,
  SMSPager,
  SMSPagerText,
  SMSActions,
  SMSPrimaryButton,
  SMSPrimaryText,
  SMSSecondaryButton,
  SMSSecondaryText,
} from './HomeScreen.styles.ts';

const defaultShelterImage =
  require('../assets/images/shelter.png') as ImageSourcePropType;

const languageOptions = [
  { code: 'KO', label: '한국어' },
  { code: 'EN', label: 'English' },
  { code: 'ZH', label: '中文' },
  { code: 'JA', label: '日本語' },
  { code: 'VI', label: 'Tiếng Việt' },
];

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

  return sources.length ? sources : [defaultShelterImage];
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
function formatSMSAgo(dateString: string, t: TFunction) {
  const time = new Date(dateString).getTime();
  if (Number.isNaN(time)) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return t('home.smsJustNow');
  if (minutes < 60) return t('home.smsMinutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('home.smsHoursAgo', { count: hours });
  return t('home.smsDaysAgo', { count: Math.floor(hours / 24) });
}

/** 여러 지역에 함께 발송된 문자는 콤마로 이어져 온다. 첫 지역 + "외 N곳"으로 줄인다. */
function formatSMSRegion(regionName: string, t: TFunction) {
  const regions = regionName
    .split(',')
    .map(region => region.trim())
    .filter(Boolean);
  if (regions.length <= 1) return regions[0] ?? regionName;
  return t('home.smsRegionMore', {
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
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  useCurrentLocation();
  useFetchSMS();
  useFetchDisaster();
  useFetchNearestShelter();
  useFetchContents();
  const smsData = useSMSStore(state => state.sms);
  const contents = useContentStore(state => state.contents);
  const disasterData = useDisasterStore(state => state.disaster);
  const nearestShelter = useNearestShelterStore(state => state.nearestShelter);
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
  const nearestShelterImages = nearestShelter
    ? getNearestShelterImageSources(nearestShelter)
    : [];
  const nearestShelterImageIndex = nearestShelterImages.length
    ? Math.min(shelterImageIndex, nearestShelterImages.length - 1)
    : 0;
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
            {languageOptions.map(item => (
              <LanguageButton
                key={item.code}
                $active={i18n.language === item.code}
                onPress={() => i18n.changeLanguage(item.code)}
              >
                <LanguageText $active={i18n.language === item.code}>
                  {item.label}
                </LanguageText>
              </LanguageButton>
            ))}
          </LanguageRow>

          <MessageBox
            disabled={!smsData[0]?.content}
            onPress={() => {
              if (!smsData[0]?.content) return;
              setSelectedSMSIndex(0);
              setIsSMSModalVisible(true);
            }}
          >
            <SpeakerIcon size={32} />
            <MessageTitle numberOfLines={1} ellipsizeMode="tail">
              {smsData[0]?.content ?? t('home.noActiveDisaster')}
            </MessageTitle>
          </MessageBox>
          <MessageBox2>
            <TopBox>
              <MessageTitle2 numberOfLines={1} ellipsizeMode="tail">
                {t('home.messageTitle2')}
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
              <DisasterMoreButton onPress={handlePressDisaster}>
                <DisasterMoreText>{t('home.more')}</DisasterMoreText>
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
              <ShelterImageFrame
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
              <ShelterTitleRow>
                <ShelterName>{nearestShelter.name}</ShelterName>
                <TypeChip>
                  <TypeChipText>
                    {t(
                      getShelterTypeTranslationKey(
                        nearestShelter.shelterType,
                      ) ?? getShelterTypeLabel(nearestShelter.shelterType),
                    )}
                  </TypeChipText>
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
                  <ShelterMetaText>{t('home.noScaleInfo')}</ShelterMetaText>
                ) : null}
              </ShelterMetaRow>
              <ShelterMeta>
                {[
                  nearestShelter.managingAuthorityName,
                  nearestShelter.managingAuthorityTelNo,
                ]
                  .filter(Boolean)
                  .join(' · ') || t('home.noManagingAuthority')}
              </ShelterMeta>
              <ChipRow>
                {getAccessibilityChips(nearestShelter).map(chip => (
                  <AccessChip
                    key={`${nearestShelter.shelterId}-${chip.key}`}
                    $active={chip.active}
                  >
                    <AccessChipText $active={chip.active}>
                      {t(chip.labelKey)}
                    </AccessChipText>
                  </AccessChip>
                ))}
              </ChipRow>
            </ShelterItem>
          ) : null}
        </MiddleSection>
      </HomeScroll>
      <Modal
        animationType="fade"
        transparent
        visible={!!popupContent && isNoticeModalVisible}
        onRequestClose={closeNoticeModal}
      >
        <ModalOverlay onPress={closeNoticeModal}>
          <NoticeModalCard onPress={e => e.stopPropagation()}>
            <NoticeModalHeader>
              <NoticeModalCategory>{popupContent?.name}</NoticeModalCategory>
              <NoticeCloseButton onPress={closeNoticeModal}>
                <X color={colors.textMuted} size={22} strokeWidth={2.6} />
              </NoticeCloseButton>
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
                <NoticePrimaryButton onPress={handlePressNoticeLink}>
                  <NoticePrimaryButtonText>
                    {t('home.noticeDetail')}
                  </NoticePrimaryButtonText>
                </NoticePrimaryButton>
              ) : null}
              <NoticeButton onPress={closeNoticeModal}>
                <ModalButtonText>{t('common.close')}</ModalButtonText>
              </NoticeButton>
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
          <SMSCard onPress={e => e.stopPropagation()}>
            <SMSHeader style={{ backgroundColor: smsStep.color }}>
              <smsStep.Icon
                color={colors.textOnColor}
                size={22}
                strokeWidth={2.4}
              />
              <SMSStepText>{t(`home.smsStep.${smsStepKey}`)}</SMSStepText>
              {selectedSMS?.category ? (
                <SMSCategoryChip>
                  <SMSCategoryText numberOfLines={1}>
                    {selectedSMS.category}
                  </SMSCategoryText>
                </SMSCategoryChip>
              ) : null}
              <SMSHeaderSpacer />
              <SMSCloseButton
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={() => setIsSMSModalVisible(false)}
              >
                <X color={colors.textOnColor} size={22} strokeWidth={2.4} />
              </SMSCloseButton>
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
                    {formatSMSRegion(selectedSMS.regionName, t)}
                  </SMSMetaText>
                </SMSMetaRow>
              ) : null}
              {selectedSMS?.issuedAt ? (
                <SMSMetaRow>
                  <Clock color={colors.textMuted} size={16} strokeWidth={2.2} />
                  <SMSMetaText>
                    {formatSMSAgo(selectedSMS.issuedAt, t)} ·{' '}
                    {formatSMSDateTime(selectedSMS.issuedAt)}
                  </SMSMetaText>
                </SMSMetaRow>
              ) : null}
              <SMSContentBox style={{ borderLeftColor: smsStep.color }}>
                <SMSContentScroll>
                  <SMSContentText>
                    {selectedSMS?.content ?? t('home.noSms')}
                  </SMSContentText>
                </SMSContentScroll>
              </SMSContentBox>

              {smsData.length > 1 ? (
                <SMSPager>
                  <IconButton
                    accessibilityRole="button"
                    accessibilityLabel={t('home.smsPrev')}
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
                    accessibilityRole="button"
                    accessibilityLabel={t('home.smsNext')}
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
                <SMSPrimaryButton
                  accessibilityRole="button"
                  onPress={() => {
                    setIsSMSModalVisible(false);
                    if (nearestShelter) handlePressNearestShelter();
                    else navigation.navigate('Map');
                  }}
                >
                  <SMSPrimaryText>{t('home.smsFindShelter')}</SMSPrimaryText>
                </SMSPrimaryButton>
                <SMSSecondaryButton
                  accessibilityRole="button"
                  onPress={() => setIsSMSModalVisible(false)}
                >
                  <SMSSecondaryText>{t('common.close')}</SMSSecondaryText>
                </SMSSecondaryButton>
              </SMSActions>
            </SMSBody>
          </SMSCard>
        </ModalOverlay>
      </Modal>
      <FullscreenImageViewer value={imageModal} onChange={setImageModal} />
    </Screen>
  );
}
