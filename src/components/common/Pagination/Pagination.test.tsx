import { render } from '@testing-library/react';

import Pagination from './Pagination';

describe('Pagination', () => {
  render(
    <Pagination onPageChanged={jest.fn()} pageLimit={30} totalScores={10} />
  );
  it.todo('should not render, when totalpages 0 or 1');
  it.todo('should call handleClick when selecting a page');
  it.todo('should call onPageChanged when selecting a page');
  it.todo(
    'should call onPageChanged with correct paginationData when selecting a page'
  );
  it.todo('should call handleMoveLeft when clicking left arrow');
  it.todo('should call handleMoveRight when clicking right arrow');
});
