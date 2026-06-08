import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpeakerIcon from '../assets/icons/SpeakerIcon';

export default function HomeScreen() {
  return (
    <Screen>
      <TopSection>
        <MessageBox>
          <SpeakerIcon size={32} />
          <MessageTitle>재난문자 영역</MessageTitle>
        </MessageBox>
        <MessageBox2>
          <TopBox>
            <MessageTitle2>일일 재난안전관리 상황</MessageTitle2>
            <TimeText>05.14(목)</TimeText>
          </TopBox>
        </MessageBox2>
      </TopSection>
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

const MessageBox = styled.View`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
`;

const MessageTitle = styled.Text`
  color: #999999;
  font-size: 18px;
  font-weight: 700;
`;

const MessageBox2 = styled.View`
  display: flex;
  background-color: #edf5ff;
  margin-left: 24px;
  padding: 12px;
  border-radius: 0 8px 8px 8px;
`;

const TopBox = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
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
