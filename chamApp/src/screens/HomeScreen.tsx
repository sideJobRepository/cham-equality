import { Linking } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpeakerIcon from '../assets/icons/SpeakerIcon';
import { useFetchSMS } from '../services/sms.service.ts';
import { useDisasterStore, useSMSStore } from '../store';
import { useFetchDisaster } from '../services/disaster.service.ts';

function formatDisasterDate(dateString?: string) {
  if (!dateString) return '';

  //일일재난 날짜계산
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];

  return `${month}.${day}(${weekday})`;
}

export default function HomeScreen() {
  useFetchSMS();
  useFetchDisaster();
  const smsData = useSMSStore(state => state.sms);
  console.log('smsdata', smsData);
  const disasterData = useDisasterStore(state => state.disaster);
  console.log('disasterData', disasterData);
  const disasterSummary = disasterData?.summary?.slice(0, 3) ?? [];
  const disasterDate = formatDisasterDate(disasterData?.createDate);
  const handlePressDisaster = () => {
    if (!disasterData?.originUrl) return;
    Linking.openURL(disasterData.originUrl);
  };

  return (
    <Screen>
      <TopSection>
        <MessageBox>
          <SpeakerIcon size={32} />
          <MessageTitle>재난문자 영역</MessageTitle>
        </MessageBox>
        <MessageBox2
          disabled={!disasterData?.originUrl}
          onPress={handlePressDisaster}
        >
          <TopBox>
            <MessageTitle2>일일 재난안전관리 상황</MessageTitle2>
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

const MessageBox2 = styled.Pressable`
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
