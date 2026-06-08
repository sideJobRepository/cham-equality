import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MoreScreen() {
  return (
    <Screen>
      <Title>더보기</Title>
      <Description>공지, 설정, 앱 정보를 확인합니다.</Description>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  justify-content: center;
  padding: 24px;
  background-color: #f7f8fb;
`;

const Title = styled.Text`
  color: #111827;
  font-size: 28px;
  font-weight: 700;
`;

const Description = styled.Text`
  margin-top: 8px;
  color: #6b7280;
  font-size: 16px;
`;
