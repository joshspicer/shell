import { render, waitFor } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { getMockStore } from '@cased/redux';
import { IEntry, ILog } from '@cased/data';

import GroupLogs from './group-logs';

describe('GroupLogs', () => {
  interface IOptions {
    group?: IEntry;
    groupLogsResponse?: ILog[];
  }

  const setup = (options: IOptions = {}) => {
    const { groupLogsResponse = [], group = { id: '1', name: 'Lorem Ipsum' } } =
      options;

    const settingsService = {
      getGroupLogs: () =>
        Promise.resolve({
          group,
          logs: groupLogsResponse,
        }),
    };

    window.history.pushState({}, '', `/settings/groups/activity/1`);
    return render(
      <StoreProvider
        store={getMockStore({
          settingsService,
        })}
      >
        <Routes>
          <Route path="/settings/groups/activity/:id" element={<GroupLogs />} />
        </Routes>
      </StoreProvider>,
      { wrapper: BrowserRouter },
    );
  };

  it('should render successfully', async () => {
    const { findByTestId } = setup();
    await waitFor(() => findByTestId('group-logs'));

    expect(findByTestId('group-logs'));
  });

  it('should print the group name', async () => {
    const name = 'Group 1';
    const group = { name, id: '1' };

    const { findByTestId } = setup({ group });
    await waitFor(() => findByTestId('group-logs__name'));
    const result = await findByTestId('group-logs__name');

    expect(result.textContent).toContain('Group 1');
  });

  it('should print out logs', async () => {
    const email = 'asdf@asdf.com';
    const groupLogsResponse: ILog[] = [
      {
        id: '1',
        email: 'asdf@asdf.com',
        location: 'Federal Way, Washington',
        host: 'Unknown',
        ip: '73.181.219.55',
      },
    ];

    const { findByTestId, findByText } = setup({ groupLogsResponse });
    await waitFor(() => findByTestId('group-logs'));

    expect(findByText(email)).toBeTruthy();
  });
});
