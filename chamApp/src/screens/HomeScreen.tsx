import { useState } from 'react';
import { Linking, Modal, type ImageSourcePropType } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  ChevronLeft,
  ChevronRight,
  Square,
  Users,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import CurrentLocationBar from '../components/CurrentLocationBar.tsx';
import MapSearchFilters from '../components/MapSearchFilters.tsx';
import { useCurrentLocation } from '../hooks/useCurrentLocation.ts';
import SpeakerIcon from '../assets/icons/SpeakerIcon';
import { useFetchSMS } from '../services/sms.service.ts';
import { useFetchNearestShelter } from '../services/map.service.ts';
import { useDisasterStore, useNearestShelterStore, useSMSStore } from '../store';
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

const defaultShelterImage = require('../assets/images/shelter.png') as ImageSourcePropType;

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

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  useCurrentLocation();
  useFetchSMS();
  useFetchDisaster();
  useFetchNearestShelter();
  const smsData = useSMSStore(state => state.sms);
  const disasterData = useDisasterStore(state => state.disaster);
  const nearestShelter = useNearestShelterStore(state => state.nearestShelter);
  const disasterSummary = disasterData?.summary?.slice(0, 3) ?? [];
  const disasterDate = formatDisasterDate(disasterData?.createDate);
  const [isSMSModalVisible, setIsSMSModalVisible] = useState(false);
  const [selectedSMSIndex, setSelectedSMSIndex] = useState(0);
  const [shelterImageIndex, setShelterImageIndex] = useState(0);
  const [imageModal, setImageModal] = useState<{
    images: ImageSourcePropType[];
    index: number;
  } | null>(null);
  const selectedSMS = smsData[selectedSMSIndex];
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

  return (
    <Screen>
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
        <MessageBox2
          disabled={!disasterData?.originUrl}
          onPress={handlePressDisaster}
        >
          <TopBox>
            <MessageTitle2>{t('home.messageTitle2')}</MessageTitle2>
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
        </MessageBox2>
      </TopSection>
      <MiddleSection>
        <CurrentLocationBar />
        <MapSearchFilters horizontalPadding={0} showShelterTypes={false} />
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
                    <ChevronLeft color="#ffffff" size={18} strokeWidth={2.8} />
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
                    <ChevronRight color="#ffffff" size={18} strokeWidth={2.8} />
                  </ImageNavButton>
                  <ImageCounter>
                    <ImageCounterText>
                      {nearestShelterImageIndex + 1}/{nearestShelterImages.length}
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
                    getShelterTypeTranslationKey(nearestShelter.shelterType) ??
                      getShelterTypeLabel(nearestShelter.shelterType),
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
                <ShelterMetaText>규모 정보 없음</ShelterMetaText>
              ) : null}
            </ShelterMetaRow>
            <ShelterMeta>
              {[
                nearestShelter.managingAuthorityName,
                nearestShelter.managingAuthorityTelNo,
              ]
                .filter(Boolean)
                .join(' · ') || '관리기관 정보 없음'}
            </ShelterMeta>
            <ChipRow>
              {getAccessibilityChips(nearestShelter).map(chip => (
                <AccessChip
                  key={`${nearestShelter.shelterId}-${chip.label}`}
                  $active={chip.active}
                >
                  <AccessChipText $active={chip.active}>
                    {t(accessibilityFilterLabelKeys[chip.label] ?? chip.label)}
                  </AccessChipText>
                </AccessChip>
              ))}
            </ChipRow>
          </ShelterItem>
        ) : null}
      </MiddleSection>
      <Modal
        animationType="fade"
        transparent
        visible={isSMSModalVisible}
        onRequestClose={() => setIsSMSModalVisible(false)}
      >
        <ModalOverlay onPress={() => setIsSMSModalVisible(false)}>
          <ModalCard onPress={e => e.stopPropagation()}>
            <ModalHeader>
              <IconButton
                disabled={selectedSMSIndex === 0}
                onPress={() =>
                  setSelectedSMSIndex(index => Math.max(index - 1, 0))
                }
              >
                <ChevronLeft
                  color={selectedSMSIndex === 0 ? '#d1d5db' : '#111827'}
                  size={24}
                  strokeWidth={2.5}
                />
              </IconButton>
              <ModalCategory>
                {selectedSMS?.category ?? '재난문자'}
              </ModalCategory>
              <IconButton
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
                  size={24}
                  strokeWidth={2.5}
                />
              </IconButton>
            </ModalHeader>
            <ModalContent>
              {selectedSMS?.content ?? '표시할 재난문자가 없습니다.'}
            </ModalContent>
            <ModalButton onPress={() => setIsSMSModalVisible(false)}>
              <ModalButtonText>닫기</ModalButtonText>
            </ModalButton>
          </ModalCard>
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
                                index: (current.index + 1) % current.images.length,
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
  height: 132px;
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
  font-size: 18px;
  font-weight: 700;
`;

const MessageBox2 = styled.Pressable`
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
  color: #2776e0;
  font-size: 16px;
  font-weight: 600;
`;

const TimeText = styled.Text`
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

const ModalHeader = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const IconButton = styled.Pressable`
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
`;

const ModalCategory = styled.Text`
  flex: 1;
  text-align: center;
  color: #dc2626;
  font-size: 18px;
  font-weight: 800;
`;

const ModalContent = styled.Text`
  color: #111827;
  font-size: 15px;
  line-height: 24px;
  font-weight: 500;
`;

const ModalButton = styled.Pressable`
  align-self: flex-end;
  padding: 10px 14px;
  border-radius: 10px;
  background-color: #f3f4f6;
`;

const ModalButtonText = styled.Text`
  color: #111827;
  font-size: 14px;
  font-weight: 700;
`;
