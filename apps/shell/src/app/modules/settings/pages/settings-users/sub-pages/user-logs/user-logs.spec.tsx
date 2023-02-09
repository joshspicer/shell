import { ILog, IUser } from '@cased/remotes';
import { render, waitFor } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { getMockStore } from '@cased/redux';
import { A } from '@cased/test-utilities';
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
    userLogsResponse?: {
      logs: ILog[];
      user: IUser;
    };
  }

  const setup = (options: IOptions = {}) => {
    const { userLogsResponse = { logs: [], user: A.user().build() } } = options;

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
    const { findByText } = setup({
      userLogsResponse: { user: A.user().build(), logs: [response] },
    });
    await waitFor(() => findByText(text));

    expect(findByText(text)).toBeTruthy();
  };

  it('should render successfully', async () => {
    const { findByTestId } = setup();

    await waitFor(() => findByTestId('user-logs'));

    expect(findByTestId('user-logs')).toBeTruthy();
  });

  it('should print out the name of the existing user', async () => {
    const name = 'Gambit';

    const { findByTestId } = setup({
      userLogsResponse: {
        user: A.user().withName(name).build(),
        logs: [{ ...defaultLog }],
      },
    });

    await waitFor(async () => {
      const result = await findByTestId('user-logs__name');
      expect(result.textContent).toContain(name);
    });
  });

  it('should print out the email of the existing user', async () => {
    const email = 'rogue@gmail.com';

    const { findByTestId } = setup({
      userLogsResponse: {
        user: A.user().withEmail(email).build(),
        logs: [{ ...defaultLog }],
      },
    });

    await waitFor(async () => {
      const result = await findByTestId('user-logs__email');
      expect(result.textContent).toContain(email);
    });
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
        userLogsResponse: {
          user: A.user().build(),
          logs: [
            {
              ...defaultLog,
              approval: {
                id: '1',
                reason: 'User requested access',
              },
            },
          ],
        },
      });

      await waitFor(() => findByTestId('log-card__reason'));

      expect((await findByTestId('log-card__reason')).textContent).toContain(
        'User requested access',
      );
    });
  });
});
