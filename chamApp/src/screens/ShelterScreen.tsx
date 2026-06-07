import styled from 'styled-components/native';

export default function ShelterScreen() {
  return (
    <Screen>
      <Title>대피소</Title>
      <Description>대피소 목록 화면</Description>
    </Screen>
  );
}

const Screen = styled.View`
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
