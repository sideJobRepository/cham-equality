import { useEffect, useState } from 'react';
import { Linking, Modal, type ImageSourcePropType } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  ACCESSIBILITY_SELECTED_COLOR,
  SHELTER_SELECTED_COLOR,
  accessibilityFilterLabelKeys,
  shelterTypeLabelMap,
  shelterTypeTranslationKeys,
} from '../store/mapFilters.ts';
import { useFetchDisaster } from '../services/disaster.service.ts';
import type { RootTabParamList } from '../navigation/AppNavigator.tsx';
import { useFetchContents } from '../services/content.service.ts';

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
  if (!type) return '유형 정보 없음';
  return shelterTypeLabelMap[type] ?? type;
}

function getShelterTypeTranslationKey(type?: string) {
  if (!type) return null;
  return shelterTypeTranslationKeys[type] ?? null;
}

function getAccessibilityChips(shelter: NearestShelter) {
  return [
    { label: '경사로', active: shelter.ramp === true },
    { label: '엘리베이터', active: shelter.elevator === true },
    { label: '점자블록', active: shelter.brailleBlock === true },
    { label: '장애인 화장실', active: shelter.accessibleToilet === true },
  ];
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
  CRITICAL: { color: '#dc2626', Icon: Siren },
  EMERGENCY: { color: '#ea580c', Icon: TriangleAlert },
  ADVISORY: { color: '#093a6e', Icon: Info },
  ETC: { color: '#475569', Icon: Info },
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
              {smsData[0]?.content ?? '현재 발령된 재난이 없습니다.'}
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
                        color="#ffffff"
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
                        color="#ffffff"
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
                    <Users color="#4b5563" size={14} strokeWidth={2.4} />
                    <ShelterMetaText>
                      {nearestShelter.capacity.toLocaleString()}
                    </ShelterMetaText>
                  </ShelterMetaIconText>
                ) : null}
                {typeof nearestShelter.area === 'number' ? (
                  <ShelterMetaIconText>
                    <Square color="#4b5563" size={13} strokeWidth={2.4} />
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
                    key={`${nearestShelter.shelterId}-${chip.label}`}
                    $active={chip.active}
                  >
                    <AccessChipText $active={chip.active}>
                      {t(
                        accessibilityFilterLabelKeys[chip.label] ?? chip.label,
                      )}
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
                <X color="#6b7280" size={22} strokeWidth={2.6} />
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
              <smsStep.Icon color="#ffffff" size={22} strokeWidth={2.4} />
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
                <X color="#ffffff" size={22} strokeWidth={2.4} />
              </SMSCloseButton>
            </SMSHeader>

            <SMSBody>
              {selectedSMS?.regionName ? (
                <SMSMetaRow>
                  <MapPin color="#6b7280" size={16} strokeWidth={2.2} />
                  <SMSMetaText numberOfLines={1}>
                    {formatSMSRegion(selectedSMS.regionName, t)}
                  </SMSMetaText>
                </SMSMetaRow>
              ) : null}
              {selectedSMS?.issuedAt ? (
                <SMSMetaRow>
                  <Clock color="#6b7280" size={16} strokeWidth={2.2} />
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
                      color={selectedSMSIndex === 0 ? '#d1d5db' : '#111827'}
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
                          ? '#d1d5db'
                          : '#111827'
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
      <Modal
        animationType="fade"
        transparent
        visible={!!imageModal}
        onRequestClose={() => setImageModal(null)}
      >
        <ImageModalOverlay onPress={() => setImageModal(null)}>
          <ImageModalContent pointerEvents="box-none">
            {imageModal ? (
              <>
                <ImageModalImage
                  source={imageModal.images[imageModal.index]}
                  resizeMode="contain"
                />
                <ImageCloseButton onPress={() => setImageModal(null)}>
                  <X color="#ffffff" size={24} strokeWidth={2.8} />
                </ImageCloseButton>
                {imageModal.images.length > 1 ? (
                  <>
                    <ModalImageNavButton
                      $position="left"
                      onPress={() =>
                        setImageModal(current =>
                          current
                            ? {
                                ...current,
                                index:
                                  (current.index - 1 + current.images.length) %
                                  current.images.length,
                              }
                            : current,
                        )
                      }
                    >
                      <ChevronLeft
                        color="#ffffff"
                        size={26}
                        strokeWidth={2.8}
                      />
                    </ModalImageNavButton>
                    <ModalImageNavButton
                      $position="right"
                      onPress={() =>
                        setImageModal(current =>
                          current
                            ? {
                                ...current,
                                index:
                                  (current.index + 1) % current.images.length,
                              }
                            : current,
                        )
                      }
                    >
                      <ChevronRight
                        color="#ffffff"
                        size={26}
                        strokeWidth={2.8}
                      />
                    </ModalImageNavButton>
                    <ModalImageCounter>
                      <ImageCounterText>
                        {imageModal.index + 1}/{imageModal.images.length}
                      </ImageCounterText>
                    </ModalImageCounter>
                  </>
                ) : null}
              </>
            ) : null}
          </ImageModalContent>
        </ImageModalOverlay>
      </Modal>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  background-color: #ffffff;
`;

const HomeScroll = styled.ScrollView`
  flex: 1;
`;

const TopSection = styled.View`
  display: flex;
  width: 100%;
`;

const MiddleSection = styled.View`
  display: flex;
  width: 100%;
  gap: 10px;
  margin-top: 16px;
`;

const ShelterItem = styled.Pressable`
  gap: 5px;
  margin-top: 2px;
  padding: 10px;
  border-radius: 12px;
  background-color: #f8fafc;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const ShelterImageFrame = styled.Pressable`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 10px;
  background-color: #e5e7eb;
`;

const ShelterImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const ImageNavButton = styled.Pressable<{ $position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $position }) => `${$position}: 8px;`}
  width: 30px;
  height: 30px;
  margin-top: -15px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.62);
`;

const ImageCounter = styled.View`
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 3px 7px;
  border-radius: 999px;
  background-color: rgba(17, 24, 39, 0.68);
`;

const ImageCounterText = styled.Text`
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
`;

const ImageModalOverlay = styled.Pressable`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.86);
`;

const ImageModalContent = styled.Pressable`
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const ImageModalImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const ImageCloseButton = styled.Pressable`
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

const ModalImageNavButton = styled.Pressable<{ $position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $position }) => `${$position}: 16px;`}
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.62);
`;

const ModalImageCounter = styled.View`
  position: absolute;
  right: 16px;
  bottom: 32px;
  padding: 5px 10px;
  border-radius: 999px;
  background-color: rgba(17, 24, 39, 0.72);
`;

const ShelterTitleRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const ShelterName = styled.Text`
  width: 100%;
  color: #111827;
  font-size: 14px;
  line-height: 19px;
  font-weight: 800;
`;

const ShelterMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const ShelterMetaIconText = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const ShelterMetaText = styled.Text`
  color: #4b5563;
  font-size: 12px;
  line-height: 18px;
`;

const ShelterMeta = styled.Text`
  color: #4b5563;
  font-size: 12px;
  line-height: 18px;
`;

const ChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
`;

const TypeChip = styled.View`
  padding: 4px 7px;
  border-radius: 999px;
  background-color: ${SHELTER_SELECTED_COLOR};
`;

const TypeChipText = styled.Text`
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
`;

const AccessChip = styled.View<{ $active: boolean }>`
  padding: 5px 7px;
  border-radius: 999px;
  background-color: ${({ $active }) =>
    $active ? ACCESSIBILITY_SELECTED_COLOR : '#f3f4f6'};
  border-width: 1px;
  border-color: ${({ $active }) =>
    $active ? ACCESSIBILITY_SELECTED_COLOR : '#e5e7eb'};
`;

const AccessChipText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#ffffff' : '#9ca3af')};
  font-size: 10px;
  font-weight: 800;
`;

const LanguageRow = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
`;

const LanguageButton = styled.Pressable<{ $active: boolean }>`
  padding: 6px 10px;
  border-radius: 8px;
  background-color: ${({ $active }) => ($active ? '#1d1d1f' : '#f3f4f6')};
`;

const LanguageText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#ffffff' : '#6b7280')};
  font-size: 13px;
  font-weight: 700;
`;

const MessageBox = styled.Pressable`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  width: 100%;
`;

const MessageTitle = styled.Text`
  flex: 1;
  color: #999999;
  font-size: 16px;
  font-weight: 700;
`;

const MessageBox2 = styled.View`
  display: flex;
  background-color: #edf5ff;
  margin-top: 14px;
  margin-left: 24px;
  padding: 12px;
  border-radius: 0 8px 8px 8px;
`;

const TopBox = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const SummaryRow = styled.View`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
`;

const SummaryDot = styled.View`
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background-color: #1d1d1f;
  margin-top: 8px;
`;

const MessageTitle2 = styled.Text`
  flex: 1;
  color: #2776e0;
  font-size: 16px;
  font-weight: 600;
`;

const TimeText = styled.Text`
  flex-shrink: 0;
  font-size: 14px;
  color: #a3a7ac;
`;

const CenterBox = styled.View`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
`;

const SummaryText = styled.Text`
  color: #1d1d1f;
  font-size: 14px;
  line-height: 20px;
  flex: 1;
  font-weight: 500;
`;

const DisasterMoreButton = styled.Pressable`
  align-self: flex-end;
  margin-top: 10px;
  padding: 4px 0 0 12px;
`;

const DisasterMoreText = styled.Text`
  color: #a3a7ac;
  font-size: 13px;
  font-weight: 600;
`;

const ModalOverlay = styled.Pressable`
  flex: 1;
  justify-content: center;
  padding: 24px;
  background-color: rgba(15, 23, 42, 0.45);
`;

const ModalCard = styled.Pressable`
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 18px;
  background-color: #ffffff;
`;

const NoticeModalCard = styled(ModalCard)`
  gap: 14px;
  padding: 18px;
`;

const NoticeModalHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const NoticeModalCategory = styled.Text`
  color: #1f3a5f;
  font-size: 16px;
  font-weight: 800;
`;

const NoticeCloseButton = styled.Pressable`
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
`;

const NoticeImage = styled.Image`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background-color: #e5e7eb;
`;

const NoticeContent = styled.Text`
  color: #4b5563;
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
`;

const NoticeButtonRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

const NoticeButton = styled.Pressable`
  padding: 10px 14px;
  border-radius: 10px;
  background-color: #f3f4f6;
`;

const NoticePrimaryButton = styled.Pressable`
  padding: 10px 14px;
  border-radius: 10px;
  background-color: #1f3a5f;
`;

const NoticePrimaryButtonText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
`;

const IconButton = styled.Pressable`
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
`;

const ModalButtonText = styled.Text`
  color: #111827;
  font-size: 14px;
  font-weight: 700;
`;

const SMSCard = styled.Pressable`
  overflow: hidden;
  border-radius: 20px;
  background-color: #ffffff;
`;

const SMSHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 14px 12px 14px 18px;
`;

const SMSStepText = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
`;

const SMSCategoryChip = styled.View`
  flex-shrink: 1;
  padding: 3px 10px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.22);
`;

const SMSCategoryText = styled.Text`
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
`;

const SMSHeaderSpacer = styled.View`
  flex: 1;
`;

const SMSCloseButton = styled.Pressable`
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
`;

const SMSBody = styled.View`
  gap: 10px;
  padding: 16px 18px 18px;
`;

const SMSMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const SMSMetaText = styled.Text`
  flex-shrink: 1;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
`;

const SMSContentBox = styled.View`
  margin-top: 4px;
  max-height: 320px;
  border-left-width: 4px;
  border-radius: 12px;
  background-color: #f8fafc;
`;

const SMSContentScroll = styled.ScrollView`
  padding: 14px 16px;
`;

const SMSContentText = styled.Text`
  color: #111827;
  font-size: 16px;
  line-height: 26px;
  font-weight: 500;
`;

const SMSPager = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const SMSPagerText = styled.Text`
  min-width: 48px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
`;

const SMSActions = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 4px;
`;

const SMSPrimaryButton = styled.Pressable`
  flex: 1;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: #093a6e;
`;

const SMSPrimaryText = styled.Text`
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
`;

const SMSSecondaryButton = styled.Pressable`
  min-width: 80px;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: #f3f4f6;
`;

const SMSSecondaryText = styled.Text`
  color: #111827;
  font-size: 15px;
  font-weight: 700;
`;
