import { thunk } from 'easy-peasy';
import {
  dispatchAddError,
  dispatchClearErrors,
  dispatchSet404,
} from '../notifications/notifications.store';
import { dispatchSetLoading } from '../loading/loading.store';
import type { ISettingsStore } from './i-settings-store';

export const settingsThunks: Pick<
  ISettingsStore,
  | 'populateShell'
  | 'setCertificateAuthentication'
  | 'populateGroupsAndUsers'
  | 'updateUserRole'
  | 'updateUserAccess'
  | 'updateGroupAccess'
  | 'populateUserLogs'
  | 'populateGroupLogs'
  | 'populateGroupDetails'
  | 'connectGitHub'
  | 'disconnectGitHub'
  | 'setReasonRequired'
  | 'setRecordOutput'
> = {
  connectGitHub: thunk(
    async (actions, _, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      if (!code || !state) {
        return dispatchSetLoading(dispatch, false);
      }
      try {
        const { connected } = await settingsService.connectToGitHub({
          code,
          state,
        });
        if (connected) {
          actions.populateShell();
        }
      } catch (e) {
        dispatchAddError(dispatch, 'Failed to connect GitHub');
      } finally {
        dispatchSetLoading(dispatch, false);
      }
      return true;
    },
  ),

  disconnectGitHub: thunk(
    async (actions, _, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);
      try {
        await settingsService.disconnectFromGitHub();
        actions.populateShell();
      } catch (e) {
        dispatchAddError(dispatch, 'Failed to disconnect GitHub');
      } finally {
        dispatchSetLoading(dispatch, false);
      }
    },
  ),

  setReasonRequired: thunk(
    async (
      actions,
      { required },
      { injections: { settingsService }, dispatch },
    ) => {
      dispatchSetLoading(dispatch, true);

      const reasonRequired = await settingsService.setReasonRequired(required);
      actions.set({ shell: { reasonRequired } });

      dispatchSetLoading(dispatch, false);
    },
  ),

  setRecordOutput: thunk(
    async (
      actions,
      { record },
      { injections: { settingsService }, dispatch },
    ) => {
      dispatchSetLoading(dispatch, true);

      const recordOutput = await settingsService.setRecordOutput(record);
      actions.set({ shell: { recordOutput } });

      dispatchSetLoading(dispatch, false);
    },
  ),

  populateGroupsAndUsers: thunk(
    async (actions, _, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);

      const { groups, users } = await settingsService.getGroupsAndUsers();
      actions.setGroups(groups);
      actions.setUsers(users);

      const { user: userAccess, group: groupAccess } =
        await settingsService.getPromptAccess();
      actions.setUserAccess(userAccess);
      actions.setGroupAccess(groupAccess);

      dispatchSetLoading(dispatch, false);
    },
  ),

  updateUserRole: thunk(
    async (
      actions,
      { id, role },
      { injections: { settingsService }, dispatch },
    ) => {
      dispatchSetLoading(dispatch, true);

      const user = await settingsService.setUserRole(id, role);
      actions.setUser({ id, user });

      dispatchSetLoading(dispatch, false);
    },
  ),

  setCertificateAuthentication: thunk(
    async (
      actions,
      { enable },
      { injections: { settingsService }, dispatch },
    ) => {
      dispatchSetLoading(dispatch, true);

      const certificateAuthentication = await settingsService.setCaEnabled(
        enable,
      );
      actions.set({ certificateAuthentication });

      dispatchSetLoading(dispatch, false);
    },
  ),

  updateUserAccess: thunk(
    async (
      actions,
      { value: rawValue },
      { injections: { settingsService }, dispatch },
    ) => {
      const value = JSON.parse(rawValue);
      dispatchClearErrors(dispatch);
      dispatchSetLoading(dispatch, true, false);

      try {
        await settingsService.setPromptAccess(value, 'user');
        actions.setUserAccess(rawValue);
      } catch (e) {
        dispatchAddError(dispatch, 'Format Error: Please fix');
      }

      dispatchSetLoading(dispatch, false);
    },
  ),

  updateGroupAccess: thunk(
    async (
      actions,
      { value: rawValue },
      { injections: { settingsService }, dispatch },
    ) => {
      const value = JSON.parse(rawValue);
      dispatchClearErrors(dispatch);
      dispatchSetLoading(dispatch, true, false);

      try {
        await settingsService.setPromptAccess(value, 'group');
        actions.setGroupAccess(rawValue);
      } catch (e) {
        dispatchAddError(dispatch, 'Format Error: Please fix');
      }

      dispatchSetLoading(dispatch, false);
    },
  ),

  populateUserLogs: thunk(
    async (actions, { id }, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);

      try {
        const userLogs = await settingsService.getUserLogs(id);
        actions.setUserLogs(userLogs);
      } catch (e) {
        dispatchSet404(dispatch, true);
      }

      dispatchSetLoading(dispatch, false);
    },
  ),

  populateGroupLogs: thunk(
    async (actions, { id }, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);

      try {
        const { logs, group } = await settingsService.getGroupLogs(id);
        actions.setGroupLogs(logs);
        actions.setGroupLogDetails(group);
      } catch (e) {
        dispatchSet404(dispatch, true);
      }

      dispatchSetLoading(dispatch, false);
    },
  ),

  populateShell: thunk(
    async (actions, _, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);

      const currentSettings = await settingsService.getAllSettings();
      actions.set(currentSettings);

      dispatchSetLoading(dispatch, false);
    },
  ),

  populateGroupDetails: thunk(
    async (actions, { id }, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);

      try {
        const group = await settingsService.getGroupDetails(id);
        actions.setGroupDetails(group);
      } catch (e) {
        dispatchSet404(dispatch, true);
      }

      dispatchSetLoading(dispatch, false);
    },
  ),
};
