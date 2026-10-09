import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronRight,
  ClipboardList,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  X,
} from 'lucide-react-native';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import { useUserStore } from '../store/user';
import { usePushStore } from '../store/push';
import {
  hasNotificationPermission,
  updatePushPreferences,
} from '../services/push.service';
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
import ImageAttachButton from '../components/ui/ImageAttachButton.tsx';
import SubmitButton from '../components/ui/SubmitButton.tsx';
import Button from '../components/ui/Button.tsx';
import IconButton from '../components/ui/IconButton.tsx';
import { colors } from '../theme/index.ts';
import {
  Screen,
  Content,
  IntroHero,
  IntroRightGradient,
  IntroTitle,
  IntroDescription,
  Section,
  SectionTitle,
  ServiceList,
  ServiceButton,
  ServiceLabel,
  ServiceIcon,
  ServiceText,
  SettingBlock,
  LanguageRow,
  LanguageButton,
  LanguageText,
  LoginBlock,
  Greeting,
  KakaoButton,
  LoginIcon,
  AppleLoginIcon,
  KakaoText,
  NaverButton,
  NaverIconText,
  NaverText,
  AppleButton,
  AppleText,
  WithdrawButton,
  WithdrawText,
  FeedbackEntryButton,
  FeedbackIconBox,
  FeedbackModalCard,
  FeedbackModalScroll,
  FeedbackField,
  FeedbackLabel,
  FeedbackChipRow,
  FeedbackCategoryChip,
  FeedbackCategoryText,
  FeedbackTextArea,
  FeedbackInput,
  FeedbackCount,
  FeedbackImageItem,
  FeedbackImagePreview,
  FeedbackImageName,
  ReportListBlock,
  ReportLoadingRow,
  ReportListButton,
  ReportListIconBox,
  ReportListBody,
  ReportListTitle,
  ReportListMeta,
  ReportEmptyText,
  ReportModalOverlay,
  ReportModalCard,
  ReportModalHeader,
  ReportModalTitle,
  ReportDetailLoading,
  ReportDetailScroll,
  ReportDetailName,
  ReportDetailAddress,
  ReportDetailStatus,
  ReportDetailSection,
  ReportDetailSectionTitle,
  ReportChipRow,
  ReportAccessChip,
  ReportAccessChipText,
  ReportDetailText,
  ReportDetailImageRow,
  ReportDetailImage,
  ReportDetailImagePlaceholder,
  ReportDetailImageInfo,
  ReportDetailImageCategory,
  ReportDetailImageDescription,
  NotificationRow,
  NotificationTextBox,
  NotificationLabel,
  NotificationDescription,
  NotificationDivider,
  NotificationPermissionBox,
  NotificationPermissionText,
  NotificationSettingsButton,
  NotificationSettingsText,
} from './MoreScreen.styles.ts';

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
  labelKey: string;
}> = [
  { value: 'BUG', labelKey: 'feedback.categories.BUG' },
  { value: 'IMPROVEMENT', labelKey: 'feedback.categories.IMPROVEMENT' },
  { value: 'SHELTER_DATA', labelKey: 'feedback.categories.SHELTER_DATA' },
  { value: 'CONTENT', labelKey: 'feedback.categories.CONTENT' },
  { value: 'ETC', labelKey: 'feedback.categories.ETC' },
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
          if (__DEV__) {
            console.log('[my-reports] fetch failed', {
              status: error?.response?.status,
              data: error?.response?.data,
              message: error?.message,
            });
          }
        })
        .finally(() => {
          if (!ignore) setReportsLoading(false);
        });

      return () => {
        ignore = true;
      };
    }, [user]),
  );

  // 알림 설정. OS 알림 권한이 꺼져 있으면 앱 토글을 켜도 안 오므로 설정으로 안내한다.
  const disasterEnabled = usePushStore(state => state.disasterEnabled);
  const personalEnabled = usePushStore(state => state.personalEnabled);
  const [notificationAllowed, setNotificationAllowed] = useState(true);
  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      hasNotificationPermission()
        .then(allowed => {
          if (!ignore) setNotificationAllowed(allowed);
        })
        .catch(() => {});
      return () => {
        ignore = true;
      };
    }, []),
  );

  // 제보 결과 알림을 눌러 들어오면 그 제보 상세를 연다.
  const openReportId = usePushStore(state => state.openReportId);
  const clearOpenReport = usePushStore(state => state.clearOpenReport);

  const openReportDetail = async (reportId: number) => {
    setReportDetailLoading(true);
    try {
      const detail = await fetchMyShelterReportDetail(reportId);
      setSelectedReport(detail);
    } catch (error: any) {
      if (__DEV__) {
        console.log('[my-reports] detail failed', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });
      }
      alert(
        error?.response?.data?.message ?? t('moreReports.detailFailed'),
        undefined,
        { tone: 'error' },
      );
    } finally {
      setReportDetailLoading(false);
    }
  };

  useEffect(() => {
    if (openReportId == null || !user) return;
    clearOpenReport();
    openReportDetail(openReportId);
    // openReportDetail 은 매 렌더 새로 만들어지지만 openReportId 를 바로 비우므로 한 번만 돈다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openReportId, user, clearOpenReport]);

  const onKakao = async () => {
    try {
      await kakaoLogin();
      alert(t('auth.loginDone'), undefined, { tone: 'success' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('auth.kakaoLoginFailed');
      alert(message, undefined, { tone: 'error' });
    }
  };

  const onNaver = async () => {
    try {
      await naverLogin();
      alert(t('auth.loginDone'), undefined, { tone: 'success' });
    } catch (error) {
      if (error instanceof Error && error.message === 'NAVER_LOGIN_CANCELLED') {
        return;
      }
      const message =
        error instanceof Error ? error.message : t('auth.naverLoginFailed');
      alert(message, undefined, { tone: 'error' });
    }
  };

  const onApple = async () => {
    try {
      await appleLogin();
      alert(t('auth.loginDone'), undefined, { tone: 'success' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('auth.appleLoginFailed');
      alert(message, undefined, { tone: 'error' });
    }
  };

  const onLogout = async () => {
    await logout();
    alert(t('auth.logoutDone'), undefined, { tone: 'success' });
  };

  const onWithdraw = async () => {
    const ok = await confirm(
      t('auth.withdrawConfirmTitle'),
      t('auth.withdrawConfirmDesc'),
      { tone: 'warning', destructive: true },
    );
    if (!ok) return;
    try {
      await withdraw();
      alert(t('auth.withdrawDone'), undefined, { tone: 'success' });
    } catch {
      alert(t('auth.withdrawFailed'), undefined, { tone: 'error' });
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
      alert(t('feedback.maxImages'), undefined, { tone: 'warning' });
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
      alert(t('feedback.contentRequired'), undefined, { tone: 'warning' });
      return;
    }
    if (content.length > 2000) {
      alert(t('feedback.contentTooLong'), undefined, { tone: 'warning' });
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
      alert(t('feedback.submitted'), undefined, { tone: 'success' });
    } catch (error: any) {
      if (__DEV__) {
        console.log('[feedback] submit failed', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });
      }
      alert(
        error?.response?.data?.message ?? t('feedback.submitFailed'),
        undefined,
        { tone: 'error' },
      );
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
                <ChevronRight
                  color={colors.textMuted}
                  size={20}
                  strokeWidth={2.4}
                />
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
          <SectionTitle>{t('more.notifications.title')}</SectionTitle>
          <SettingBlock>
            <NotificationRow>
              <NotificationTextBox>
                <NotificationLabel>
                  {t('more.notifications.disaster')}
                </NotificationLabel>
                <NotificationDescription>
                  {t('more.notifications.disasterDescription')}
                </NotificationDescription>
              </NotificationTextBox>
              <Switch
                accessibilityLabel={t('more.notifications.disaster')}
                value={disasterEnabled}
                onValueChange={value =>
                  updatePushPreferences({ disasterEnabled: value })
                }
                trackColor={{ false: colors.borderStrong, true: '#93c5fd' }}
                thumbColor={
                  disasterEnabled ? colors.primary : colors.background
                }
              />
            </NotificationRow>
            <NotificationDivider />
            <NotificationRow>
              <NotificationTextBox>
                <NotificationLabel>
                  {t('more.notifications.personal')}
                </NotificationLabel>
                <NotificationDescription>
                  {t('more.notifications.personalDescription')}
                </NotificationDescription>
              </NotificationTextBox>
              <Switch
                accessibilityLabel={t('more.notifications.personal')}
                value={personalEnabled}
                onValueChange={value =>
                  updatePushPreferences({ personalEnabled: value })
                }
                trackColor={{ false: colors.borderStrong, true: '#93c5fd' }}
                thumbColor={
                  personalEnabled ? colors.primary : colors.background
                }
              />
            </NotificationRow>
            {!notificationAllowed ? (
              <NotificationPermissionBox>
                <NotificationPermissionText>
                  {t('more.notifications.permissionOff')}
                </NotificationPermissionText>
                <NotificationSettingsButton
                  accessibilityRole="button"
                  onPress={() => Linking.openSettings()}
                >
                  <NotificationSettingsText>
                    {t('more.notifications.openSettings')}
                  </NotificationSettingsText>
                </NotificationSettingsButton>
              </NotificationPermissionBox>
            ) : null}
          </SettingBlock>
        </Section>

        <Section>
          <SectionTitle>{t('feedback.title')}</SectionTitle>
          <FeedbackEntryButton
            onPress={() => setIsFeedbackVisible(true)}
            accessibilityRole="button"
          >
            <ServiceLabel>
              <FeedbackIconBox>
                <MessageSquare
                  color={colors.primary}
                  size={18}
                  strokeWidth={2.5}
                />
              </FeedbackIconBox>
              <ServiceText>{t('feedback.entry')}</ServiceText>
            </ServiceLabel>
            <ChevronRight
              color={colors.textDisabled}
              size={20}
              strokeWidth={2.4}
            />
          </FeedbackEntryButton>
        </Section>

        {user ? (
          <Section>
            <SectionTitle>{t('moreReports.title')}</SectionTitle>
            <ReportListBlock>
              {reportsLoading ? (
                <ReportLoadingRow>
                  <ActivityIndicator color={colors.primary} />
                </ReportLoadingRow>
              ) : reports.length ? (
                reports.map(report => (
                  <ReportListButton
                    key={String(report.id)}
                    onPress={() => openReportDetail(report.id)}
                  >
                    <ReportListIconBox>
                      <ClipboardList
                        color={colors.primary}
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
                    <ChevronRight
                      color={colors.textDisabled}
                      size={20}
                      strokeWidth={2.4}
                    />
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
              <Button
                label={t('auth.logout')}
                onPress={onLogout}
                variant="outline"
                fullWidth
              />
              <WithdrawButton accessibilityRole="button" onPress={onWithdraw}>
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
                <ReportModalTitle>{t('feedback.title')}</ReportModalTitle>
                <IconButton
                  onPress={closeFeedbackModal}
                  accessibilityLabel={t('common.close')}
                >
                  <X color={colors.textMuted} size={22} strokeWidth={2.6} />
                </IconButton>
              </ReportModalHeader>

              <FeedbackModalScroll showsVerticalScrollIndicator={false}>
                <FeedbackField>
                  <FeedbackLabel>{t('feedback.category')}</FeedbackLabel>
                  <FeedbackChipRow>
                    {feedbackCategoryOptions.map(option => (
                      <FeedbackCategoryChip
                        key={option.value}
                        $active={feedbackCategory === option.value}
                        onPress={() => setFeedbackCategory(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: feedbackCategory === option.value,
                        }}
                      >
                        <FeedbackCategoryText
                          $active={feedbackCategory === option.value}
                        >
                          {t(option.labelKey)}
                        </FeedbackCategoryText>
                      </FeedbackCategoryChip>
                    ))}
                  </FeedbackChipRow>
                </FeedbackField>

                <FeedbackField>
                  <FeedbackLabel>{t('feedback.content')}</FeedbackLabel>
                  <FeedbackTextArea
                    value={feedbackContent}
                    onChangeText={setFeedbackContent}
                    placeholder={t('feedback.contentPlaceholder')}
                    placeholderTextColor={colors.textDisabled}
                    multiline
                    maxLength={2000}
                    textAlignVertical="top"
                  />
                  <FeedbackCount>{feedbackContent.length}/2000</FeedbackCount>
                </FeedbackField>

                <FeedbackField>
                  <FeedbackLabel>{t('feedback.contact')}</FeedbackLabel>
                  <FeedbackInput
                    value={feedbackContact}
                    onChangeText={setFeedbackContact}
                    placeholder={t('feedback.contactPlaceholder')}
                    placeholderTextColor={colors.textDisabled}
                  />
                </FeedbackField>

                <FeedbackField>
                  <FeedbackLabel>{t('feedback.photo')}</FeedbackLabel>
                  <ImageAttachButton
                    label={t('feedback.addPhoto')}
                    onPress={addFeedbackImages}
                  />

                  {feedbackImages.map(image => (
                    <FeedbackImageItem key={image.id}>
                      <FeedbackImagePreview source={{ uri: image.uri }} />
                      <FeedbackImageName numberOfLines={1}>
                        {image.fileName}
                      </FeedbackImageName>
                      <IconButton
                        onPress={() => removeFeedbackImage(image.id)}
                        accessibilityLabel={t('map.a11y.removeImage')}
                        visualSize={32}
                        backgroundColor={colors.dangerSoft}
                      >
                        <Trash2
                          color={colors.danger}
                          size={16}
                          strokeWidth={2.4}
                        />
                      </IconButton>
                    </FeedbackImageItem>
                  ))}
                </FeedbackField>
              </FeedbackModalScroll>

              <SubmitButton
                label={t('feedback.submit')}
                loading={isFeedbackSubmitting}
                onPress={submitFeedback}
              />
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
              <IconButton
                accessibilityLabel={t('common.close')}
                onPress={() => setSelectedReport(null)}
              >
                <X color={colors.textMuted} size={22} strokeWidth={2.6} />
              </IconButton>
            </ReportModalHeader>

            {reportDetailLoading && !selectedReport ? (
              <ReportDetailLoading>
                <ActivityIndicator color={colors.primary} />
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
                              color={colors.textDisabled}
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
