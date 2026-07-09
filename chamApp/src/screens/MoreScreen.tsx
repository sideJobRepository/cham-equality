import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/user';
import {
  useKakaoLogin,
  useAppleLogin,
  useLogout,
} from '../services/auth.service';

export default function MoreScreen() {
  const { t } = useTranslation();
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
    } catch {
      // 사용자 취소 등은 무시
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Title>{t('tabs.more')}</Title>

      {user ? (
        <Section>
          <Greeting>{t('auth.greeting', { name: user.name })}</Greeting>
          <LogoutButton onPress={() => logout()}>
            <LogoutText>{t('auth.logout')}</LogoutText>
          </LogoutButton>
        </Section>
      ) : (
        <Section>
          <LoginPrompt>{t('auth.loginTitle')}</LoginPrompt>
          <KakaoButton onPress={onKakao}>
            <KakaoText>{t('auth.kakao')}</KakaoText>
          </KakaoButton>
          {Platform.OS === 'ios' ? (
            <AppleButton onPress={onApple}>
              <AppleText>{t('auth.apple')}</AppleText>
            </AppleButton>
          ) : null}
        </Section>
      )}
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  padding: 24px 20px;
  background-color: #f4f7fb;
`;

const Title = styled.Text`
  color: #111827;
  font-size: 22px;
  font-weight: 800;
`;

const Section = styled.View`
  margin-top: 24px;
  gap: 12px;
`;

const Greeting = styled.Text`
  color: #111827;
  font-size: 16px;
  font-weight: 700;
`;

const LoginPrompt = styled.Text`
  color: #4b5563;
  font-size: 14px;
  margin-bottom: 4px;
`;

const KakaoButton = styled.Pressable`
  height: 50px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: #fee500;
`;

const KakaoText = styled.Text`
  color: #191600;
  font-size: 15px;
  font-weight: 800;
`;

const AppleButton = styled.Pressable`
  height: 50px;
  align-items: center;
  justify-content: center;
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
