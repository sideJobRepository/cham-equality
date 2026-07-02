import { useState } from 'react';
import { Linking, Modal } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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
  console.log('smsData', smsData);
  const disasterData = useDisasterStore(state => state.disaster);
  const disasterSummary = disasterData?.summary?.slice(0, 3) ?? [];
  const disasterDate = formatDisasterDate(disasterData?.createDate);
  const [isSMSModalVisible, setIsSMSModalVisible] = useState(false);
  const [selectedSMSIndex, setSelectedSMSIndex] = useState(0);
  const selectedSMS = smsData[selectedSMSIndex];
  const handlePressDisaster = () => {
    if (!disasterData?.originUrl) return;
    Linking.openURL(disasterData.originUrl);
  };

  return (
    <Screen>
      <TopSection>
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
                onPress={() => setSelectedSMSIndex(index => Math.max(index - 1, 0))}
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
                    selectedSMSIndex >= smsData.length - 1 ? '#d1d5db' : '#111827'
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
