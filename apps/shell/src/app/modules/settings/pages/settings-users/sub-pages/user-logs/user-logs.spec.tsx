import { ILog } from '@cased/remotes';
import { render, waitFor } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { getMockStore } from '@cased/redux';

import UserLogs from './user-logs';

describe('UserLogs', () => {
  const defaultLog: Readonly<ILog> = {
    id: '1',
    email: 'asdf@asdf.com',
    location: 'Federal Way, Washington',
    host: 'Unknown',
    ip: '73.181.219.55',
  };

  interface IOptions {
    userLogsResponse?: ILog[];
  }

  const setup = (options: IOptions = {}) => {
    const { userLogsResponse = [] } = options;

    const settingsService = {
      getUserLogs: () => Promise.resolve(userLogsResponse),
    };

    window.history.pushState({}, '', `/settings/users/1`);
    return render(
      <StoreProvider
        store={getMockStore({
          settingsService,
        })}
      >
        <Routes>
          <Route path="/settings/users/:id" element={<UserLogs />} />
        </Routes>
      </StoreProvider>,
      { wrapper: BrowserRouter },
    );
  };

  const matchTextWithResponse = async (text: string, response: ILog) => {
    const { findByText } = setup({ userLogsResponse: [response] });
    await waitFor(() => findByText(text));

    expect(findByText(text)).toBeTruthy();
  };

  it('should render successfully', async () => {
    const { findByTestId } = setup();

    await waitFor(() => findByTestId('user-logs'));

    expect(findByTestId('user-logs')).toBeTruthy();
  });

  describe('runbooks', () => {
    it('should print out logs', async () => {
      await matchTextWithResponse(defaultLog.email, {
        ...defaultLog,
        runbook: {
          id: '1',
          name: 'Get user data dump',
          date: new Date(),
        },
      });
    });
  });

  describe('sessions', () => {
    it('should print out an active session', async () => {
      await matchTextWithResponse('Active', {
        ...defaultLog,
        session: {
          id: '1',
          startTime: new Date(),
        },
      });
    });

    it('should print out an inactive session', async () => {
      await matchTextWithResponse('Inactive', {
        ...defaultLog,
        session: {
          id: '1',
          startTime: new Date(),
          endTime: new Date(),
        },
      });
    });
  });

  describe('approvals', () => {
    it('should print the reason', async () => {
      const { findByTestId } = setup({
        userLogsResponse: [
          {
            ...defaultLog,
            approval: {
              id: '1',
              reason: 'User requested access',
            },
          },
        ],
      });

      await waitFor(() => findByTestId('log-card__reason'));

      expect((await findByTestId('log-card__reason')).textContent).toContain(
        'User requested access',
      );
    });
  });
});
