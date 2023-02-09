import { IApiProvider, IRunbookDatabase } from '@cased/data';
import {
  fireEvent,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { BrowserRouter } from 'react-router-dom';
import { getMockStore } from '@cased/redux';
import SettingsRunbooks from './settings-runbooks';

describe('SettingsRunbooks', () => {
  interface IOptions {
    apiProviders?: IApiProvider[];
    databases?: IRunbookDatabase[];
  }

  const setup = async (options: IOptions = {}) => {
    const { apiProviders = [], databases = [] } = {
      ...options,
    };

    const settingsRunbooksService = {
      getAllApiProviders: () => Promise.resolve(apiProviders),
      getAllDatabases: () => Promise.resolve(databases),
      deleteApiProvider: jest.fn().mockResolvedValue(null),
      deleteDatabase: jest.fn().mockResolvedValue(null),
    };

    const result = render(
      <StoreProvider store={getMockStore({ settingsRunbooksService })}>
        <SettingsRunbooks />
      </StoreProvider>,
      {
        wrapper: BrowserRouter,
      },
    );

    await waitFor(() => result.getByTestId('settings-runbooks'));

    return result;
  };

  it('should render successfully', async () => {
    const { getByTestId } = await setup();

    await waitFor(() => expect(getByTestId('settings-runbooks')).toBeTruthy());
  });

  describe('API Provider', () => {
    const apiProviders = [{ id: '1', name: 'Provider 1' }];

    it('should print all the returned results', async () => {
      const { getByText } = await setup({ apiProviders });

      expect(getByText('Provider 1')).toBeTruthy();
    });

    it('should delete the runbook after approving window alert confirm deletion', async () => {
      const confirm = true;

      window.confirm = jest.fn(() => confirm);
      const { getByText, queryByText, queryAllByText } = await setup({
        apiProviders,
      });

      fireEvent.click(getByText('Delete'));

      await waitForElementToBeRemoved(() => queryByText('Provider 1'));
      expect(queryAllByText('Provider 1').length).toEqual(0);
    });

    it('should not delete the runbook if the user cancels deletion', async () => {
      const confirm = false;

      window.confirm = jest.fn(() => confirm);
      const { getByText } = await setup({ apiProviders });

      fireEvent.click(getByText('Delete'));

      expect(getByText('Provider 1')).toBeTruthy();
    });
  });

  describe('Databases', () => {
    const databases = [{ id: '1', name: 'Database 1' }];

    it('should print all the returned results', async () => {
      const { getByText } = await setup({ databases });

      expect(getByText('Database 1')).toBeTruthy();
    });

    it('should delete the database after approving window alert confirm deletion', async () => {
      const confirm = true;

      window.confirm = jest.fn(() => confirm);
      const { getByText, queryByText, queryAllByText } = await setup({
        databases,
      });

      fireEvent.click(getByText('Delete'));

      await waitForElementToBeRemoved(() => queryByText('Database 1'));
      expect(queryAllByText('Database 1').length).toEqual(0);
    });

    it('should not delete the runbook if the user cancels deletion', async () => {
      const confirm = false;

      window.confirm = jest.fn(() => confirm);
      const { getByText } = await setup({ databases });

      fireEvent.click(getByText('Delete'));

      expect(getByText('Database 1')).toBeTruthy();
    });
  });
});
