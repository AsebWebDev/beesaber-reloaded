import { MDBContainer, MDBTabsContent } from 'mdb-react-ui-kit';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import Pagination from '@/components/common/Pagination/Pagination';
import filterScores from '@/helper/filterScores';

import ScoreHeader from './ScoreHeader/ScoreHeader';
import ScoreNavbar from './ScoreNavbar/ScoreNavbar';
import ScoreTabs from './ScoreTabs/ScoreTabs';

import type { Scores, UserData } from '@/sharedTypes';

const Container = styled(MDBContainer)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
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

type Props = Required<Pick<UserData, 'scoreData'>>;

function ScoreBox({ scoreData }: Props): JSX.Element | null {
  if (scoreData.scoresRecent.length === 0) return null;

  const [query, setQuery] = useState('');
  const [activeitem, setActiveItem] = useState('1');
  const [isPlayedByHive, setIsPlayedByHive] = useState(false);
  const [allScores, setAllScores] = useState<Scores>(scoreData.scoresRecent);
  const [displayedScores, setDisplayedScores] = useState<Scores>([]);

  const [pageLimit, setPageLimit] = useState(5);
  const [offset, setOffset] = useState(5);
  const totalScores = allScores.length;

  const toggleTab = (tab: string) => {
    if (activeitem !== tab) setActiveItem(tab);
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
    const scoreType = activeitem === '1' ? 'scoresRecent' : 'scoresTop';
    const filteredScores = filterScores(
      scoreData[scoreType],
      query,
      isPlayedByHive
    );

    setAllScores(filteredScores);
  }, [query, isPlayedByHive]);

  return (
    <Container>
      <ScoreHeader onChange={(e) => setQuery(e.target.value)} query={query} />
      <ScoreNavbar
        activeitem={activeitem}
        setIsPlayedByHive={setIsPlayedByHive}
        toggleTab={toggleTab}
      />
      <MDBTabsContent activeitem={activeitem}>
        <ScoreTabs tabId={activeitem} scores={displayedScores} />
        {/* // FIXME: Create "No Scores Found Component" */}
        {displayedScores.length === 0 && <div>No Scores Available</div>}
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

export default ScoreBox;
