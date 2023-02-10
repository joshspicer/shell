import { fireEvent, render, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from 'easy-peasy';
import { settingsApprovalsService as SettingsApprovalsServiceType } from '@cased/remotes';
import { ApprovalType } from '@cased/data';
import { A } from '@cased/test-utilities';
import { getMockStore } from '@cased/redux';
import EditProgramApproval from './edit-program-approval';
import PageWrapper from '../../../../../../routes/page-wrapper';

describe('EditProgramApproval', () => {
  interface IOptions {
    getApprovalProgram?: jest.Mock;
    setApprovalProgram?: jest.Mock;
    getApprovalUsersSearch?: jest.Mock;
    addAuthorizedUser?: jest.Mock;
    removeAuthorizedUser?: jest.Mock;
    pageId?: string;
    waitUntil?: (result: ReturnType<typeof render>) => void;
  }

  const setup = async (options: IOptions = {}) => {
    const {
      getApprovalProgram = jest
        .fn()
        .mockReturnValue(Promise.resolve(A.approvalProgram().build())),
      setApprovalProgram = jest.fn().mockReturnValue(Promise.resolve()),
      getApprovalUsersSearch = jest.fn().mockReturnValue(Promise.resolve([])),
      addAuthorizedUser = jest.fn().mockReturnValue(Promise.resolve()),
      removeAuthorizedUser = jest.fn().mockReturnValue(Promise.resolve()),
      pageId = '1',
      waitUntil = (result) => result.getByTestId('edit-program-approval'),
    } = options;

    const settingsApprovalsService: Partial<
      typeof SettingsApprovalsServiceType
    > = {
      getApprovalProgram,
      setApprovalProgram,
      getApprovalUsersSearch,
      addAuthorizedUser,
      removeAuthorizedUser,
    };

    global.console = { ...global.console, error: jest.fn() };

    window.history.pushState({}, '', `/settings/${pageId}`);
    const result = render(
      <StoreProvider store={getMockStore({ settingsApprovalsService })}>
        <Routes>
          <Route
            path="/settings/:id"
            element={
              <PageWrapper>
                <EditProgramApproval />
              </PageWrapper>
            }
          />
        </Routes>
      </StoreProvider>,
      {
        wrapper: BrowserRouter,
      },
    );

    await waitFor(() => waitUntil(result));

    return result;
  };

  it('should render successfully', async () => {
    const { getByTestId } = await setup();

    expect(getByTestId('edit-program-approval')).toBeTruthy();
  });

  it('should submit the form with the approval program service response after clicking submit', async () => {
    const program = A.approvalProgram().build();
    const getApprovalProgram = jest
      .fn()
      .mockReturnValue(Promise.resolve(program));
    const setApprovalProgram = jest.fn().mockReturnValue(Promise.resolve());

    const { getByText } = await setup({
      getApprovalProgram,
      setApprovalProgram,
    });

    fireEvent.click(getByText('Update Settings'));

    await waitFor(() =>
      expect(setApprovalProgram).toHaveBeenCalledWith(program.id, program),
    );
  });

  it('should handle a 404 page', async () => {
    const getApprovalProgram = jest
      .fn()
      .mockReturnValue(Promise.reject(new Error('404')));

    const { getByText } = await setup({
      getApprovalProgram,
      waitUntil: (result) => result.getByText('404'),
    });

    expect(getByText('404')).toBeTruthy();
  });

  describe('autosave', () => {
    it('should save when editing the name after 1.5 seconds', async () => {
      const setApprovalProgram = jest.fn().mockReturnValue(Promise.resolve());
      jest.useFakeTimers();

      const { getByLabelText } = await setup({ setApprovalProgram });
      const input = getByLabelText('Name');

      fireEvent.change(input, { target: { value: 'new name' } });
      jest.advanceTimersByTime(1500);

      await waitFor(() =>
        expect(setApprovalProgram).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({ name: 'new name' }),
        ),
      );
    });

    it('should not save when editing the name immediately', async () => {
      const setApprovalProgram = jest.fn().mockReturnValue(Promise.resolve());
      jest.useFakeTimers();

      const { getByLabelText } = await setup({ setApprovalProgram });
      const input = getByLabelText('Name');
      fireEvent.change(input, { target: { value: 'new name' } });

      await waitFor(() => expect(setApprovalProgram).not.toHaveBeenCalled());
    });
  });

  describe('with approval required and restrict users', () => {
    it('should render the restricted user selection input', async () => {
      const program = A.approvalProgram()
        .withApprovalRequired(true)
        .withApprovalType(ApprovalType.restrict)
        .withRestrictedUsers([{ id: '1', name: 'User 1' }])
        .build();

      const getApprovalProgram = jest
        .fn()
        .mockReturnValue(Promise.resolve(program));

      const { getByLabelText } = await setup({ getApprovalProgram });

      expect(getByLabelText('Approved Users')).toBeTruthy();
    });

    it('should not render the restricted user selection input if approval type is anyone', async () => {
      const program = A.approvalProgram()
        .withApprovalRequired(true)
        .withApprovalType(ApprovalType.anyone)
        .build();

      const getApprovalProgram = jest
        .fn()
        .mockReturnValue(Promise.resolve(program));

      const { queryAllByLabelText } = await setup({ getApprovalProgram });

      expect(queryAllByLabelText('Approved Users').length).toEqual(0);
    });

    it('should pre-populate existing user values', async () => {
      const program = A.approvalProgram()
        .withApprovalRequired(true)
        .withApprovalType(ApprovalType.restrict)
        .withRestrictedUsers([{ id: '1', name: 'User 1' }])
        .build();

      const getApprovalProgram = jest
        .fn()
        .mockReturnValue(Promise.resolve(program));

      const { getByText } = await setup({ getApprovalProgram });

      expect(getByText('User 1')).toBeTruthy();
    });

    it('should display user suggestions after typing into the selection input', async () => {
      const program = A.approvalProgram()
        .withApprovalRequired(true)
        .withApprovalType(ApprovalType.restrict)
        .build();

      const searchResult = [{ id: '1', name: 'User 1' }];

      const getApprovalProgram = jest
        .fn()
        .mockReturnValue(Promise.resolve(program));

      const getApprovalUsersSearch = jest
        .fn()
        .mockReturnValue(Promise.resolve(searchResult));

      jest.useFakeTimers();
      const { getByLabelText, getByText } = await setup({
        getApprovalProgram,
        getApprovalUsersSearch,
      });

      const input = getByLabelText('Approved Users');
      fireEvent.change(input, { target: { value: 'User' } });
      jest.advanceTimersByTime(500);

      await waitFor(() => expect(getByText('User 1')));

      const result = getByText(searchResult[0].name);
      expect(result).toBeTruthy();
    });

    it('should save the updated input after selecting a suggestion', async () => {
      const pageId = '2';

      const program = A.approvalProgram()
        .withApprovalRequired(true)
        .withApprovalType(ApprovalType.restrict)
        .build();

      const searchResult = [{ id: '1', name: 'User 1' }];
      const addAuthorizedUser = jest.fn().mockReturnValue(Promise.resolve());

      const getApprovalProgram = jest
        .fn()
        .mockReturnValue(Promise.resolve(program));

      const getApprovalUsersSearch = jest
        .fn()
        .mockReturnValue(Promise.resolve(searchResult));

      jest.useFakeTimers();
      const { getByLabelText, getByText } = await setup({
        getApprovalProgram,
        getApprovalUsersSearch,
        addAuthorizedUser,
        pageId,
      });

      const input = getByLabelText('Approved Users');
      fireEvent.change(input, { target: { value: 'User' } });
      jest.advanceTimersByTime(500);

      await waitFor(() => getByText('User 1'));
      fireEvent.click(getByText('User 1'));

      expect(addAuthorizedUser).toHaveBeenCalledWith(
        pageId,
        searchResult[0].id,
      );
    });

    it('should save the updated input after removing a user', async () => {
      const program = A.approvalProgram()
        .withApprovalRequired(true)
        .withApprovalType(ApprovalType.restrict)
        .withRestrictedUsers([{ id: '2', name: 'User 1' }])
        .build();

      const removeAuthorizedUser = jest.fn().mockReturnValue(Promise.resolve());

      const getApprovalProgram = jest
        .fn()
        .mockReturnValue(Promise.resolve(program));

      const { getByText } = await setup({
        getApprovalProgram,
        removeAuthorizedUser,
      });
      fireEvent.click(getByText('Remove'));

      expect(removeAuthorizedUser).toHaveBeenCalledWith('1', '2');
    });
  });
});
