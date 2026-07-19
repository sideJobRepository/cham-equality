import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { useUserStore } from '../store/user';
import {
  useKakaoLogin,
  useAppleLogin,
  useLogout,
} from '../services/auth.service';
import { useDialogUtil } from '../utils/dialog';

const kakaoIcon = require('../assets/icons/kakao.png');
const appleIcon = require('../assets/icons/apple.png');

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
  },
  {
    titleKey: 'more.chamSite',
    url: 'http://www.cham.or.kr/app/main/index',
  },
];

export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const { alert } = useDialogUtil();
  const user = useUserStore(state => state.user);
  const kakaoLogin = useKakaoLogin();
  const appleLogin = useAppleLogin();
  const logout = useLogout();

  const onKakao = async () => {
    try {
      await kakaoLogin();
    } catch {
      // 사용자 취소 등은 무시
    }
  };

  const onApple = async () => {
    try {
      await appleLogin();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Apple 로그인에 실패했습니다.';
      alert(message);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Content showsVerticalScrollIndicator={false}>
        <Section>
          <SectionTitle>{t('more.citizenServices')}</SectionTitle>
          <ServiceList>
            {citizenServices.map(service => (
              <ServiceButton
                key={service.url}
                onPress={() => Linking.openURL(service.url)}
              >
                <ServiceText>{t(service.titleKey)}</ServiceText>
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
          <SectionTitle>{t('more.login')}</SectionTitle>
          {user ? (
            <LoginBlock>
              <Greeting>{t('auth.greeting', { name: user.name })}</Greeting>
              <LogoutButton onPress={() => logout()}>
                <LogoutText>{t('auth.logout')}</LogoutText>
              </LogoutButton>
            </LoginBlock>
          ) : (
            <LoginBlock>
              <KakaoButton onPress={onKakao}>
                <LoginIcon source={kakaoIcon} resizeMode="contain" />
                <KakaoText>{t('auth.kakao')}</KakaoText>
              </KakaoButton>
              <AppleButton onPress={onApple}>
                <AppleLoginIcon source={appleIcon} resizeMode="contain" />
                <AppleText>{t('auth.apple')}</AppleText>
              </AppleButton>
            </LoginBlock>
          )}
        </Section>
      </Content>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: #f4f7fb;
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 24px 20px;
`;

const Section = styled.View`
  margin-top: 24px;
  gap: 12px;
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

const ServiceText = styled.Text`
  flex: 1;
  font-size: 15px;
  font-weight: 600;
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
  min-height: 34px;
  padding: 0 12px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? '#2563eb' : '#d1d5db')};
  background-color: ${({ $active }) => ($active ? '#eff6ff' : '#ffffff')};
`;

const LanguageText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#1d4ed8' : '#374151')};
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
  color: #111827;
  font-size: 16px;
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
