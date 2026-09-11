import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronRight,
  ClipboardList,
  Image as ImageIcon,
  ImagePlus,
  MessageSquare,
  Send,
  Trash2,
  X,
} from 'lucide-react-native';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { getKeyHashAndroid } from '@react-native-kakao/core';
import { useUserStore } from '../store/user';
import {
  useKakaoLogin,
  useNaverLogin,
  useAppleLogin,
  useLogout,
  useWithdraw,
} from '../services/auth.service';
import {
  fetchMyShelterReportDetail,
  fetchMyShelterReports,
  type ShelterReportDetail,
  type ShelterReportListItem,
} from '../services/report.service';
import {
  createAppFeedback,
  getFeedbackDeviceInfo,
  uploadFeedbackImages,
  type AppFeedbackCategory,
  type LocalFeedbackImage,
} from '../services/feedback.service';
import { useDialogUtil } from '../utils/dialog';

const kakaoIcon = require('../assets/icons/kakao.png');
const appleIcon = require('../assets/icons/apple.png');
const foodMapLogo = require('../assets/icons/logo.png');
const chamLogo = require('../assets/icons/logo2.png');

const languageOptions = [
  { code: 'KO', label: '한국어' },
  { code: 'EN', label: 'English' },
  { code: 'ZH', label: '中文' },
  { code: 'JA', label: '日本語' },
  { code: 'VI', label: 'Tiếng Việt' },
];

const citizenServices = [
  {
    titleKey: 'more.foodMap',
    url: 'https://cham-monimap.com/',
    icon: foodMapLogo,
    iconWidth: 24,
    iconAspectRatio: 542 / 768,
  },
  {
    titleKey: 'more.chamSite',
    url: 'http://www.cham.or.kr/app/main/index',
    icon: chamLogo,
    iconWidth: 24,
    iconAspectRatio: 39 / 38,
  },
];

const feedbackCategoryOptions: Array<{
  value: AppFeedbackCategory;
  label: string;
}> = [
  { value: 'BUG', label: '오류/버그' },
  { value: 'IMPROVEMENT', label: '개선 제안' },
  { value: 'SHELTER_DATA', label: '대피소 정보 오류' },
  { value: 'CONTENT', label: '콘텐츠/번역 오류' },
  { value: 'ETC', label: '기타' },
];

function toFeedbackLocalImage(asset: Asset): LocalFeedbackImage | null {
  if (!asset.uri) return null;

  const fallbackName = `feedback-${Date.now()}.jpg`;
  return {
    id: `${asset.uri}-${asset.fileSize ?? Date.now()}`,
    uri: asset.uri,
    fileName: asset.fileName || fallbackName,
    contentType: asset.type || 'image/jpeg',
    fileSize: asset.fileSize ?? 0,
  };
}

function formatReportDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}.${String(date.getDate()).padStart(2, '0')}`;
}

function toAccessibilityChips(report: ShelterReportDetail) {
  return [
    {
      key: 'ramp',
      labelKey: 'map.filters.ramp',
      active: report.ramp,
    },
    {
      key: 'elevator',
      labelKey: 'map.filters.elevator',
      active: report.elevator,
    },
    {
      key: 'brailleBlock',
      labelKey: 'map.filters.brailleBlock',
      active: report.brailleBlock,
    },
    {
      key: 'accessibleToilet',
      labelKey: 'map.filters.accessibleToilet',
      active: report.accessibleToilet,
    },
  ];
}

export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const { alert, confirm } = useDialogUtil();
  const user = useUserStore(state => state.user);
  const kakaoLogin = useKakaoLogin();
  const naverLogin = useNaverLogin();
  const appleLogin = useAppleLogin();
  const logout = useLogout();
  const withdraw = useWithdraw();
  const [reports, setReports] = useState<ShelterReportListItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] =
    useState<ShelterReportDetail | null>(null);
  const [reportDetailLoading, setReportDetailLoading] = useState(false);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [feedbackCategory, setFeedbackCategory] =
    useState<AppFeedbackCategory>('ETC');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackImages, setFeedbackImages] = useState<LocalFeedbackImage[]>(
    [],
  );
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setReports([]);
        return;
      }

      let ignore = false;
      setReportsLoading(true);
      fetchMyShelterReports()
        .then(data => {
          if (!ignore) setReports(data);
        })
        .catch(error => {
          console.log('[my-reports] fetch failed', {
            status: error?.response?.status,
            data: error?.response?.data,
            message: error?.message,
          });
        })
        .finally(() => {
          if (!ignore) setReportsLoading(false);
        });

      return () => {
        ignore = true;
      };
    }, [user]),
  );

  const openReportDetail = async (reportId: number) => {
    setReportDetailLoading(true);
    try {
      const detail = await fetchMyShelterReportDetail(reportId);
      setSelectedReport(detail);
    } catch (error: any) {
      console.log('[my-reports] detail failed', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      alert(error?.response?.data?.message ?? t('moreReports.detailFailed'));
    } finally {
      setReportDetailLoading(false);
    }
  };

  const onKakao = async () => {
    const keyHash =
      Platform.OS === 'android'
        ? await getKeyHashAndroid().catch(error =>
            error instanceof Error
              ? `조회 실패: ${error.message}`
              : '조회 실패',
          )
        : undefined;

    try {
      await kakaoLogin();
      alert(t('auth.loginDone'));
    } catch (error) {
      let message =
        error instanceof Error
          ? error.message
          : '카카오 로그인에 실패했습니다.';
      if (Platform.OS === 'android') {
        message = `${message}\n\nAndroid key hash:\n${keyHash || '값 없음'}`;
      }
      alert(message);
    }
  };

  const onNaver = async () => {
    try {
      await naverLogin();
      alert(t('auth.loginDone'));
    } catch (error) {
      if (error instanceof Error && error.message === 'NAVER_LOGIN_CANCELLED') {
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : '네이버 로그인에 실패했습니다.';
      alert(message);
    }
  };

  const onApple = async () => {
    try {
      await appleLogin();
      alert(t('auth.loginDone'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Apple 로그인에 실패했습니다.';
      alert(message);
    }
  };

  const onLogout = async () => {
    await logout();
    alert(t('auth.logoutDone'));
  };

  const onWithdraw = async () => {
    const ok = await confirm(
      t('auth.withdrawConfirmTitle'),
      t('auth.withdrawConfirmDesc'),
    );
    if (!ok) return;
    try {
      await withdraw();
      alert(t('auth.withdrawDone'));
    } catch {
      alert(t('auth.withdrawFailed'));
    }
  };

  const closeFeedbackModal = () => {
    if (isFeedbackSubmitting) return;
    setIsFeedbackVisible(false);
  };

  const resetFeedbackForm = () => {
    setFeedbackCategory('ETC');
    setFeedbackContent('');
    setFeedbackContact('');
    setFeedbackImages([]);
  };

  const addFeedbackImages = async () => {
    if (feedbackImages.length >= 5) {
      alert('사진은 최대 5장까지 첨부할 수 있습니다.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 5 - feedbackImages.length,
    });

    if (result.didCancel) return;

    const nextImages = (result.assets ?? [])
      .map(toFeedbackLocalImage)
      .filter((image): image is LocalFeedbackImage => image !== null);

    setFeedbackImages(current => [...current, ...nextImages].slice(0, 5));
  };

  const removeFeedbackImage = (imageId: string) => {
    setFeedbackImages(current => current.filter(image => image.id !== imageId));
  };

  const submitFeedback = async () => {
    const content = feedbackContent.trim();
    const contact = feedbackContact.trim();

    if (!content) {
      alert('피드백 내용을 입력해주세요.');
      return;
    }
    if (content.length > 2000) {
      alert('피드백 내용은 2000자까지 입력할 수 있습니다.');
      return;
    }

    setIsFeedbackSubmitting(true);
    try {
      const imageFileIds = await uploadFeedbackImages(feedbackImages);
      await createAppFeedback({
        category: feedbackCategory,
        content,
        contact: contact || undefined,
        screen: 'MoreScreen',
        imageFileIds,
        ...getFeedbackDeviceInfo(),
      });
      resetFeedbackForm();
      setIsFeedbackVisible(false);
      alert('피드백이 접수되었습니다.');
    } catch (error: any) {
      console.log('[feedback] submit failed', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      alert(error?.response?.data?.message ?? '피드백 제출에 실패했습니다.');
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Content showsVerticalScrollIndicator={false}>
        <IntroHero>
          <IntroRightGradient
            colors={['rgba(31,58,95,0)', '#2f4f6f', '#4b6b7a']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
          <IntroTitle>
            대전을 사람의 만남이 아름다운 도시로, 열린시대 새 지방자치를
            만들어갑니다.
          </IntroTitle>
          <IntroDescription>
            시민의 자발적인 참여와 연대에 기초해 참된 주민자치를 실현하는
            대전참여자치시민연대입니다.
          </IntroDescription>
        </IntroHero>

        <Section>
          <SectionTitle>{t('more.citizenServices')}</SectionTitle>
          <ServiceList>
            {citizenServices.map(service => (
              <ServiceButton
                key={service.url}
                onPress={() => Linking.openURL(service.url)}
              >
                <ServiceLabel>
                  <ServiceIcon
                    source={service.icon}
                    resizeMode="contain"
                    $width={service.iconWidth}
                    $aspectRatio={service.iconAspectRatio}
                  />
                  <ServiceText>{t(service.titleKey)}</ServiceText>
                </ServiceLabel>
                <ChevronRight color="#6b7280" size={20} strokeWidth={2.4} />
              </ServiceButton>
            ))}
          </ServiceList>
        </Section>

        <Section>
          <SectionTitle>{t('more.appSettings')}</SectionTitle>
          <SettingBlock>
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
          </SettingBlock>
        </Section>

        <Section>
          <SectionTitle>피드백</SectionTitle>
          <FeedbackEntryButton onPress={() => setIsFeedbackVisible(true)}>
            <ServiceLabel>
              <FeedbackIconBox>
                <MessageSquare color="#2563eb" size={18} strokeWidth={2.5} />
              </FeedbackIconBox>
              <ServiceText>피드백</ServiceText>
            </ServiceLabel>
            <ChevronRight color="#9ca3af" size={20} strokeWidth={2.4} />
          </FeedbackEntryButton>
        </Section>

        {user ? (
          <Section>
            <SectionTitle>{t('moreReports.title')}</SectionTitle>
            <ReportListBlock>
              {reportsLoading ? (
                <ReportLoadingRow>
                  <ActivityIndicator color="#2563eb" />
                </ReportLoadingRow>
              ) : reports.length ? (
                reports.map(report => (
                  <ReportListButton
                    key={String(report.id)}
                    onPress={() => openReportDetail(report.id)}
                  >
                    <ReportListIconBox>
                      <ClipboardList
                        color="#2563eb"
                        size={18}
                        strokeWidth={2.5}
                      />
                    </ReportListIconBox>
                    <ReportListBody>
                      <ReportListTitle numberOfLines={1}>
                        {report.shelterName || t('moreReports.unknownShelter')}
                      </ReportListTitle>
                      <ReportListMeta numberOfLines={1}>
                        {formatReportDate(report.createDate)} ·{' '}
                        {t(`moreReports.status.${report.requestStatus}`)}
                      </ReportListMeta>
                    </ReportListBody>
                    <ChevronRight color="#9ca3af" size={20} strokeWidth={2.4} />
                  </ReportListButton>
                ))
              ) : (
                <ReportEmptyText>{t('moreReports.empty')}</ReportEmptyText>
              )}
            </ReportListBlock>
          </Section>
        ) : null}

        <Section>
          {!user ? <SectionTitle>{t('more.login')}</SectionTitle> : null}
          {user ? (
            <LoginBlock>
              <Greeting>{t('auth.greeting', { name: user.name })}</Greeting>
              <LogoutButton onPress={onLogout}>
                <LogoutText>{t('auth.logout')}</LogoutText>
              </LogoutButton>
              <WithdrawButton onPress={onWithdraw}>
                <WithdrawText>{t('auth.withdraw')}</WithdrawText>
              </WithdrawButton>
            </LoginBlock>
          ) : (
            <LoginBlock>
              <KakaoButton onPress={onKakao}>
                <LoginIcon source={kakaoIcon} resizeMode="contain" />
                <KakaoText>{t('auth.kakao')}</KakaoText>
              </KakaoButton>
              <NaverButton onPress={onNaver}>
                <NaverIconText>N</NaverIconText>
                <NaverText>{t('auth.naver')}</NaverText>
              </NaverButton>
              {Platform.OS === 'ios' ? (
                <AppleButton onPress={onApple}>
                  <AppleLoginIcon source={appleIcon} resizeMode="contain" />
                  <AppleText>{t('auth.apple')}</AppleText>
                </AppleButton>
              ) : null}
            </LoginBlock>
          )}
        </Section>
      </Content>

      <Modal
        animationType="slide"
        transparent
        visible={isFeedbackVisible}
        onRequestClose={closeFeedbackModal}
      >
        <ReportModalOverlay onPress={closeFeedbackModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <FeedbackModalCard onPress={event => event.stopPropagation()}>
              <ReportModalHeader>
                <ReportModalTitle>피드백</ReportModalTitle>
                <ReportModalCloseButton onPress={closeFeedbackModal}>
                  <X color="#6b7280" size={22} strokeWidth={2.6} />
                </ReportModalCloseButton>
              </ReportModalHeader>

              <FeedbackModalScroll showsVerticalScrollIndicator={false}>
                <FeedbackField>
                  <FeedbackLabel>분류</FeedbackLabel>
                  <FeedbackChipRow>
                    {feedbackCategoryOptions.map(option => (
                      <FeedbackCategoryChip
                        key={option.value}
                        $active={feedbackCategory === option.value}
                        onPress={() => setFeedbackCategory(option.value)}
                      >
                        <FeedbackCategoryText
                          $active={feedbackCategory === option.value}
                        >
                          {option.label}
                        </FeedbackCategoryText>
                      </FeedbackCategoryChip>
                    ))}
                  </FeedbackChipRow>
                </FeedbackField>

                <FeedbackField>
                  <FeedbackLabel>내용</FeedbackLabel>
                  <FeedbackTextArea
                    value={feedbackContent}
                    onChangeText={setFeedbackContent}
                    placeholder="불편한 점이나 개선 의견을 입력하세요."
                    placeholderTextColor="#9ca3af"
                    multiline
                    maxLength={2000}
                    textAlignVertical="top"
                  />
                  <FeedbackCount>{feedbackContent.length}/2000</FeedbackCount>
                </FeedbackField>

                <FeedbackField>
                  <FeedbackLabel>연락처</FeedbackLabel>
                  <FeedbackInput
                    value={feedbackContact}
                    onChangeText={setFeedbackContact}
                    placeholder="답변을 원하면 이메일이나 연락처를 입력하세요."
                    placeholderTextColor="#9ca3af"
                  />
                </FeedbackField>

                <FeedbackField>
                  <FeedbackLabel>사진</FeedbackLabel>
                  <AddImageButton onPress={addFeedbackImages}>
                    <ImagePlus color="#2563eb" size={16} strokeWidth={2.6} />
                    <AddImageButtonText>사진 추가</AddImageButtonText>
                  </AddImageButton>

                  {feedbackImages.map(image => (
                    <FeedbackImageItem key={image.id}>
                      <FeedbackImagePreview source={{ uri: image.uri }} />
                      <FeedbackImageName numberOfLines={1}>
                        {image.fileName}
                      </FeedbackImageName>
                      <FeedbackImageRemoveButton
                        onPress={() => removeFeedbackImage(image.id)}
                      >
                        <Trash2 color="#ef4444" size={16} strokeWidth={2.4} />
                      </FeedbackImageRemoveButton>
                    </FeedbackImageItem>
                  ))}
                </FeedbackField>
              </FeedbackModalScroll>

              <FeedbackSubmitButton
                disabled={isFeedbackSubmitting}
                onPress={submitFeedback}
              >
                {isFeedbackSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Send color="#ffffff" size={16} strokeWidth={2.6} />
                    <FeedbackSubmitText>피드백 제출</FeedbackSubmitText>
                  </>
                )}
              </FeedbackSubmitButton>
            </FeedbackModalCard>
          </KeyboardAvoidingView>
        </ReportModalOverlay>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={!!selectedReport || reportDetailLoading}
        onRequestClose={() => setSelectedReport(null)}
      >
        <ReportModalOverlay onPress={() => setSelectedReport(null)}>
          <ReportModalCard onPress={event => event.stopPropagation()}>
            <ReportModalHeader>
              <ReportModalTitle>
                {t('moreReports.detailTitle')}
              </ReportModalTitle>
              <ReportModalCloseButton onPress={() => setSelectedReport(null)}>
                <X color="#6b7280" size={22} strokeWidth={2.6} />
              </ReportModalCloseButton>
            </ReportModalHeader>

            {reportDetailLoading && !selectedReport ? (
              <ReportDetailLoading>
                <ActivityIndicator color="#2563eb" />
              </ReportDetailLoading>
            ) : selectedReport ? (
              <ReportDetailScroll showsVerticalScrollIndicator={false}>
                <ReportDetailName>
                  {selectedReport.shelterName ||
                    t('moreReports.unknownShelter')}
                </ReportDetailName>
                {selectedReport.shelterAddress ? (
                  <ReportDetailAddress>
                    {selectedReport.shelterAddress}
                  </ReportDetailAddress>
                ) : null}
                <ReportDetailStatus>
                  {t(`moreReports.status.${selectedReport.requestStatus}`)}
                </ReportDetailStatus>

                <ReportDetailSection>
                  <ReportDetailSectionTitle>
                    {t('map.report.accessibility')}
                  </ReportDetailSectionTitle>
                  <ReportChipRow>
                    {toAccessibilityChips(selectedReport).map(chip => (
                      <ReportAccessChip
                        key={chip.key}
                        $active={chip.active === true}
                      >
                        <ReportAccessChipText $active={chip.active === true}>
                          {t(chip.labelKey)}
                        </ReportAccessChipText>
                      </ReportAccessChip>
                    ))}
                  </ReportChipRow>
                </ReportDetailSection>

                {selectedReport.etcFacilities ? (
                  <ReportDetailSection>
                    <ReportDetailSectionTitle>
                      {t('map.report.etcFacilities')}
                    </ReportDetailSectionTitle>
                    <ReportDetailText>
                      {selectedReport.etcFacilities}
                    </ReportDetailText>
                  </ReportDetailSection>
                ) : null}

                <ReportDetailSection>
                  <ReportDetailSectionTitle>
                    {t('map.report.images')}
                  </ReportDetailSectionTitle>
                  {selectedReport.images?.length ? (
                    selectedReport.images.map(image => (
                      <ReportDetailImageRow key={String(image.fileId)}>
                        {image.url ? (
                          <ReportDetailImage source={{ uri: image.url }} />
                        ) : (
                          <ReportDetailImagePlaceholder>
                            <ImageIcon
                              color="#9ca3af"
                              size={20}
                              strokeWidth={2.4}
                            />
                          </ReportDetailImagePlaceholder>
                        )}
                        <ReportDetailImageInfo>
                          <ReportDetailImageCategory>
                            {t(
                              `map.report.categories.${
                                image.category ?? 'ETC'
                              }`,
                            )}
                          </ReportDetailImageCategory>
                          {image.description ? (
                            <ReportDetailImageDescription numberOfLines={2}>
                              {image.description}
                            </ReportDetailImageDescription>
                          ) : null}
                        </ReportDetailImageInfo>
                      </ReportDetailImageRow>
                    ))
                  ) : (
                    <ReportDetailText>
                      {t('moreReports.noImages')}
                    </ReportDetailText>
                  )}
                </ReportDetailSection>
              </ReportDetailScroll>
            ) : null}
          </ReportModalCard>
        </ReportModalOverlay>
      </Modal>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: #f4f7fb;
`;

const Content = styled.ScrollView`
  flex: 1;
`;

const IntroHero = styled.View`
  position: relative;
  min-height: 150px;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 26px 18px;
  overflow: hidden;
  background-color: #1f3a5f;
`;

const IntroRightGradient = styled(LinearGradient)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 58%;
`;

const IntroTitle = styled.Text.attrs({
  textBreakStrategy: 'balanced',
  lineBreakStrategyIOS: 'hangul-word',
})`
  z-index: 1;
  width: 100%;
  flex-shrink: 1;
  color: #ffffff;
  font-size: 19px;
  line-height: 27px;
  font-weight: 800;
  text-align: center;
`;

const IntroDescription = styled.Text.attrs({
  textBreakStrategy: 'balanced',
  lineBreakStrategyIOS: 'hangul-word',
})`
  z-index: 1;
  width: 100%;
  flex-shrink: 1;
  color: #d7e2e6;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  text-align: center;
`;

const Section = styled.View`
  margin-top: 24px;
  gap: 12px;
  padding: 0 12px;
`;

const SectionTitle = styled.Text`
  color: #6b7280;
  font-size: 16px;
  font-weight: 600;
`;

const ServiceList = styled.View`
  overflow: hidden;
  border-radius: 8px;
  border-width: 1px;
  border-color: #e5e7eb;
  background-color: #ffffff;
`;

const ServiceButton = styled.Pressable`
  min-height: 54px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f1f5f9;
`;

const ServiceLabel = styled.View`
  flex: 1;
  min-width: 0;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const ServiceIcon = styled.Image<{ $width: number; $aspectRatio: number }>`
  width: ${({ $width }) => $width}px;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
`;

const ServiceText = styled.Text`
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
`;

const SettingBlock = styled.View`
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: #e5e7eb;
  background-color: #ffffff;
`;

const LanguageRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const LanguageButton = styled.Pressable<{ $active: boolean }>`
  padding: 6px 10px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${({ $active }) => ($active ? '#1d1d1f' : '#f3f4f6')};
`;

const LanguageText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#ffffff' : '#6b7280')};
  font-size: 13px;
  font-weight: 700;
`;

const LoginBlock = styled.View`
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: #e5e7eb;
  background-color: #ffffff;
`;

const Greeting = styled.Text`
  font-size: 14px;
  font-weight: 700;
`;

const KakaoButton = styled.Pressable`
  height: 50px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background-color: #fee500;
`;

const LoginIcon = styled.Image`
  width: 20px;
  height: 20px;
`;

const AppleLoginIcon = styled(LoginIcon)`
  tint-color: #ffffff;
`;

const KakaoText = styled.Text`
  color: #191600;
  font-size: 15px;
  font-weight: 800;
`;

const NaverButton = styled.Pressable`
  height: 50px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background-color: #03c75a;
`;

const NaverIconText = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 900;
`;

const NaverText = styled.Text`
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
`;

const AppleButton = styled.Pressable`
  height: 50px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background-color: #000000;
`;

const AppleText = styled.Text`
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
`;

const LogoutButton = styled.Pressable`
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border-width: 1px;
  border-color: #d1d5db;
  background-color: #ffffff;
`;

const LogoutText = styled.Text`
  color: #374151;
  font-size: 15px;
  font-weight: 700;
`;

const WithdrawButton = styled.Pressable`
  height: 36px;
  align-items: center;
  justify-content: center;
`;

const WithdrawText = styled.Text`
  color: #9ca3af;
  font-size: 13px;
  font-weight: 600;
  text-decoration-line: underline;
`;

const FeedbackEntryButton = styled.Pressable`
  min-height: 54px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border-radius: 8px;
  border-width: 1px;
  border-color: #e5e7eb;
  background-color: #ffffff;
`;

const FeedbackIconBox = styled.View`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: #eff6ff;
`;

const FeedbackModalCard = styled.Pressable`
  max-height: 90%;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  background-color: #ffffff;
`;

const FeedbackModalScroll = styled.ScrollView`
  max-height: 560px;
`;

const FeedbackField = styled.View`
  gap: 8px;
  margin-bottom: 14px;
`;

const FeedbackLabel = styled.Text`
  color: #111827;
  font-size: 13px;
  font-weight: 800;
`;

const FeedbackChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const FeedbackCategoryChip = styled.Pressable<{ $active: boolean }>`
  min-height: 36px;
  padding: 0 11px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active }) => ($active ? '#2563eb' : '#f3f4f6')};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? '#2563eb' : '#e5e7eb')};
`;

const FeedbackCategoryText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#ffffff' : '#4b5563')};
  font-size: 12px;
  font-weight: 800;
`;

const FeedbackTextArea = styled.TextInput`
  min-height: 128px;
  padding: 12px;
  border-radius: 10px;
  color: #111827;
  font-size: 14px;
  line-height: 20px;
  background-color: #f9fafb;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const FeedbackInput = styled.TextInput`
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  color: #111827;
  font-size: 14px;
  background-color: #f9fafb;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const FeedbackCount = styled.Text`
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  text-align: right;
`;

const AddImageButton = styled.Pressable`
  min-height: 40px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  background-color: #eff6ff;
  border-width: 1px;
  border-color: #bfdbfe;
`;

const AddImageButtonText = styled.Text`
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
`;

const FeedbackImageItem = styled.View`
  min-height: 58px;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 12px;
  background-color: #f9fafb;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const FeedbackImagePreview = styled.Image`
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background-color: #e5e7eb;
`;

const FeedbackImageName = styled.Text`
  flex: 1;
  min-width: 0;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
`;

const FeedbackImageRemoveButton = styled.Pressable`
  width: 30px;
  height: 30px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: #fee2e2;
`;

const FeedbackSubmitButton = styled.Pressable`
  min-height: 46px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 7px;
  background-color: #2563eb;
`;

const FeedbackSubmitText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
`;

const ReportListBlock = styled.View`
  overflow: hidden;
  border-radius: 8px;
  border-width: 1px;
  border-color: #e5e7eb;
  background-color: #ffffff;
`;

const ReportLoadingRow = styled.View`
  min-height: 72px;
  align-items: center;
  justify-content: center;
`;

const ReportListButton = styled.Pressable`
  min-height: 64px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom-width: 1px;
  border-bottom-color: #f1f5f9;
`;

const ReportListIconBox = styled.View`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: #eff6ff;
`;

const ReportListBody = styled.View`
  flex: 1;
  min-width: 0;
  gap: 4px;
`;

const ReportListTitle = styled.Text`
  color: #111827;
  font-size: 14px;
  font-weight: 800;
`;

const ReportListMeta = styled.Text`
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
`;

const ReportEmptyText = styled.Text`
  padding: 18px 14px;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
`;

const ReportModalOverlay = styled.Pressable`
  flex: 1;
  justify-content: flex-end;
  padding: 16px;
  background-color: rgba(17, 24, 39, 0.32);
`;

const ReportModalCard = styled.Pressable`
  height: 90%;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  background-color: #ffffff;
`;

const ReportModalHeader = styled.View`
  min-height: 34px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ReportModalTitle = styled.Text`
  flex: 1;
  color: #111827;
  font-size: 18px;
  font-weight: 800;
`;

const ReportModalCloseButton = styled.Pressable`
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
`;

const ReportDetailLoading = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const ReportDetailScroll = styled.ScrollView`
  flex: 1;
`;

const ReportDetailName = styled.Text`
  color: #111827;
  font-size: 17px;
  line-height: 24px;
  font-weight: 800;
`;

const ReportDetailAddress = styled.Text`
  margin-top: 4px;
  color: #4b5563;
  font-size: 13px;
  line-height: 19px;
  font-weight: 600;
`;

const ReportDetailStatus = styled.Text`
  align-self: flex-start;
  margin-top: 10px;
  padding: 5px 9px;
  border-radius: 999px;
  overflow: hidden;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  background-color: #eff6ff;
`;

const ReportDetailSection = styled.View`
  gap: 8px;
  margin-top: 18px;
`;

const ReportDetailSectionTitle = styled.Text`
  color: #111827;
  font-size: 14px;
  font-weight: 800;
`;

const ReportChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 7px;
`;

const ReportAccessChip = styled.View<{ $active: boolean }>`
  padding: 6px 9px;
  border-radius: 999px;
  background-color: ${({ $active }) => ($active ? '#2563eb' : '#f3f4f6')};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? '#2563eb' : '#e5e7eb')};
`;

const ReportAccessChipText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#ffffff' : '#9ca3af')};
  font-size: 12px;
  font-weight: 800;
`;

const ReportDetailText = styled.Text`
  color: #4b5563;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
`;

const ReportDetailImageRow = styled.View`
  flex-direction: row;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background-color: #f9fafb;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const ReportDetailImage = styled.Image`
  width: 76px;
  height: 76px;
  border-radius: 10px;
  background-color: #e5e7eb;
`;

const ReportDetailImagePlaceholder = styled.View`
  width: 76px;
  height: 76px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
`;

const ReportDetailImageInfo = styled.View`
  flex: 1;
  min-width: 0;
  gap: 6px;
`;

const ReportDetailImageCategory = styled.Text`
  color: #111827;
  font-size: 13px;
  font-weight: 800;
`;

const ReportDetailImageDescription = styled.Text`
  color: #4b5563;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
`;
