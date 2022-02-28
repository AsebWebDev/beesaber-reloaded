import { MDBContainer, MDBTabsContent } from 'mdb-react-ui-kit';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import Pagination from '@/components/common/Pagination/Pagination';
import filterScores from '@/helper/filterScores';

import NoScores from './NoScores/NoScores';
import ScoreContent from './ScoreContent/ScoreContent';
import ScoreHeader from './ScoreHeader/ScoreHeader';
import ScoreNavbar from './ScoreNavbar/ScoreNavbar';

import type { Bee, Scores, UserData } from '@/sharedTypes';

const Container = styled(MDBContainer)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
`;

const PaginationContainer = styled.div`
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
`;

type onPageChangedPayload = {
  currentPage: number;
  pageLimit: number;
};

type NavTabs = 'RECENT' | 'TOP';

type Props = Required<Pick<UserData, 'scoreData'>> & {
  bee?: Bee;
};

function ScoreBox({ bee, scoreData }: Props): JSX.Element | null {
  const { scoresRecent } = scoreData;

  if (scoresRecent.length === 0) return null;

  const [query, setQuery] = useState('');
  const [activeItem, setActiveItem] = useState<NavTabs>('RECENT');
  const [isPlayedByHive, setIsPlayedByHive] = useState(false);
  const [allScores, setAllScores] = useState<Scores>(scoresRecent);
  const [displayedScores, setDisplayedScores] = useState<Scores>([]);

  const [pageLimit, setPageLimit] = useState(5);
  const [offset, setOffset] = useState(0);
  const totalScores = allScores.length;

  const toggleTab = (tab: NavTabs) => {
    if (activeItem !== tab) setActiveItem(tab);
  };

  // data comes from Pagination Component
  const onPageChanged = (data: onPageChangedPayload): void => {
    const { currentPage, pageLimit: limit } = data;
    const newOffset = (currentPage - 1) * limit;

    setPageLimit(limit);
    setOffset(newOffset);
    setDisplayedScores(allScores.slice(offset, newOffset + limit));
  };

  useEffect(() => {
    setDisplayedScores(allScores.slice(offset, offset + pageLimit));
  }, [allScores, offset, pageLimit]);

  useEffect(() => {
    const scoreType = activeItem === 'RECENT' ? 'scoresRecent' : 'scoresTop';
    const filteredScores = filterScores(
      scoreData[scoreType],
      query,
      isPlayedByHive
    );

    setAllScores(filteredScores);
  }, [query, isPlayedByHive, activeItem]);

  return (
    <Container>
      <ScoreHeader
        bee={bee}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setQuery(e.target.value)
        }
        query={query}
      />
      <ScoreNavbar
        activeItem={activeItem}
        setIsPlayedByHive={setIsPlayedByHive}
        toggleTab={toggleTab}
      />
      <MDBTabsContent activeitem={activeItem}>
        <ScoreContent scores={displayedScores} />
        {displayedScores.length === 0 && <NoScores />}
      </MDBTabsContent>
      <PaginationContainer>
        <PaginationWrapper>
          <Pagination
            totalScores={totalScores}
            pageLimit={pageLimit}
            pageNeighbours={1}
            onPageChanged={onPageChanged}
          />
        </PaginationWrapper>
      </PaginationContainer>
    </Container>
  );
}

export type { NavTabs };

export default ScoreBox;
