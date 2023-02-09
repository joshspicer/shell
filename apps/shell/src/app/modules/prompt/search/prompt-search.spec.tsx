import { factory } from '@cased/redux';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import PromptSearch from './prompt-search';

describe('PromptSearch', () => {
  const setup = async () => {
    const searchAddon = {
      dispose: jest.fn(),
      findNext: jest.fn().mockReturnValue(true),
      findPrevious: jest.fn().mockReturnValue(true),
    };
    jest
      .spyOn(factory, 'createSearchAddon')
      .mockReturnValue(searchAddon as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const terminal: any = { loadAddon: () => {} };
    const result = render(<PromptSearch terminal={terminal} />);
    const searchButton = result.getByTestId('prompt-search__show');
    act(() => searchButton.click());

    await waitFor(
      () =>
        !result
          .getByTestId('prompt-search__content')
          .classList.contains('hidden'),
    );

    return { result, searchAddon };
  };

  it('should render', async () => {
    const {
      result: { baseElement },
    } = await setup();

    expect(baseElement).toBeTruthy();
  });

  it('should show the search box when the search button is clicked', async () => {
    const {
      result: { getByTestId },
    } = await setup();

    await waitFor(() =>
      expect(
        getByTestId('prompt-search__content').classList.contains('hidden'),
      ).toBeFalsy(),
    );
  });

  it('should hide the search box when the close button is clicked', async () => {
    const {
      result: { getByTestId },
    } = await setup();

    const closeButton = getByTestId('prompt-search__close');
    act(() => closeButton.click());

    await waitFor(() =>
      expect(
        getByTestId('prompt-search__content')?.classList.contains('hidden'),
      ).toBeTruthy(),
    );
  });

  it('should search when the next button is clicked', async () => {
    const text = 'test';

    const {
      result: { getByTestId, getByLabelText },
      searchAddon,
    } = await setup();

    const searchInput = getByLabelText('Search Text');
    fireEvent.change(searchInput, { target: { value: text } });

    const nextButton = getByTestId('prompt-search__next');
    fireEvent.click(nextButton);

    await waitFor(() =>
      expect(searchAddon.findNext).toHaveBeenCalledWith(
        text,
        expect.anything(),
      ),
    );
  });

  it('should search previous the previous button is clicked', async () => {
    const text = 'test';

    const {
      result: { getByTestId, getByLabelText },
      searchAddon,
    } = await setup();

    const searchInput = getByLabelText('Search Text');
    fireEvent.change(searchInput, { target: { value: text } });

    const prev = getByTestId('prompt-search__previous');
    fireEvent.click(prev);

    await waitFor(() =>
      expect(searchAddon.findPrevious).toHaveBeenCalledWith(
        text,
        expect.anything(),
      ),
    );
  });
});
