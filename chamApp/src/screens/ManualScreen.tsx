import { useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useFetchManuals } from '../services/manual.service.ts';
import { useManualStore } from '../store/manual.ts';

const PAGE_SIZE = 10;
const manualBanner =
  require('../assets/images/manual.png') as ImageSourcePropType;

function formatManualDate(dateString?: string) {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

export default function ManualScreen() {
  const { t } = useTranslation();
  useFetchManuals();
  const manuals = useManualStore(state => state.manuals);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(manuals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedManuals = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return manuals.slice(start, start + PAGE_SIZE);
  }, [currentPage, manuals]);

  const handlePrevPage = () => {
    setPage(value => Math.max(value - 1, 1));
  };

  const handleNextPage = () => {
    setPage(value => Math.min(value + 1, totalPages));
  };

  return (
    <Screen>
      <BannerFrame>
        <BannerImage source={manualBanner} resizeMode="contain" />
      </BannerFrame>

      <Header>
        <Title>{t('manual.title')}</Title>
      </Header>

      <Board>
        <BoardHeader>
          <HeaderTitle>{t('manual.subject')}</HeaderTitle>
          <HeaderDate>{t('manual.createdAt')}</HeaderDate>
        </BoardHeader>

        {pagedManuals.length ? (
          pagedManuals.map(manual => (
            <ManualRow key={manual.id}>
              <ManualTitle numberOfLines={1} ellipsizeMode="tail">
                {manual.title}
              </ManualTitle>
              <ManualDate>{formatManualDate(manual.createDate)}</ManualDate>
            </ManualRow>
          ))
        ) : (
          <EmptyBox>
            <EmptyText>{t('manual.empty')}</EmptyText>
          </EmptyBox>
        )}
      </Board>

      <Pagination>
        <PageButton disabled={currentPage === 1} onPress={handlePrevPage}>
          <ChevronLeft
            color={currentPage === 1 ? '#d1d5db' : '#111827'}
            size={20}
            strokeWidth={2.6}
          />
        </PageButton>
        <PageText>
          {currentPage} / {totalPages}
        </PageText>
        <PageButton
          disabled={currentPage === totalPages}
          onPress={handleNextPage}
        >
          <ChevronRight
            color={currentPage === totalPages ? '#d1d5db' : '#111827'}
            size={20}
            strokeWidth={2.6}
          />
        </PageButton>
      </Pagination>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  padding: 18px 16px;
  background-color: #ffffff;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const BannerFrame = styled.View`
  width: 100%;
  aspect-ratio: 2.64;
  margin-bottom: 16px;
`;

const BannerImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const Title = styled.Text`
  color: #2776e0;
  font-size: 22px;
  font-weight: 800;
`;

const Board = styled.View`
  overflow: hidden;
  border-radius: 8px;
  border-width: 1px;
  border-color: #e5e7eb;
  background-color: #ffffff;
`;

const BoardHeader = styled.View`
  min-height: 42px;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
  background-color: #edf5ff;
  border-bottom-width: 1px;
  border-bottom-color: #e5e7eb;
`;

const HeaderTitle = styled.Text`
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
`;

const HeaderDate = styled.Text`
  width: 88px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
`;

const ManualRow = styled.Pressable`
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  padding: 0 12px;
  border-bottom-width: 1px;
  border-bottom-color: #eef2f7;
  background-color: #ffffff;
`;

const ManualTitle = styled.Text`
  flex: 1;
  //text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #1d1d1f;
`;

const ManualDate = styled.Text`
  width: 88px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #1d1d1f;
`;

const EmptyBox = styled.View`
  min-height: 160px;
  align-items: center;
  justify-content: center;
`;

const EmptyText = styled.Text`
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
`;

const Pagination = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 16px;
`;

const PageButton = styled.Pressable`
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background-color: #ffffff;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const PageText = styled.Text`
  min-width: 58px;
  text-align: center;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
`;
