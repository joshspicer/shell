import { IApiProvider, IEntry, IRunbookDatabase } from '@cased/data';
import { thunk, Thunk } from 'easy-peasy';
import { Debounce, errorToAxiosError } from '@cased/utilities';
import {
  dispatchAddError,
  dispatchSet404,
} from '../notifications/notifications.store';
import type { IStoreInjections } from '../store';
import { dispatchSetLoading } from '../loading/loading.store';

const AUTO_SAVE_DELAY = 1500;
const AUTO_SAVE_DEBOUNCE = new Debounce(AUTO_SAVE_DELAY);

export interface ISettingsRunbooksStore {
  retrieveAllObjects: Thunk<
    ISettingsRunbooksStore,
    void,
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<{ providers: IEntry[]; databases: IEntry[] }>
  >;

  retrieveApiProvider: Thunk<
    ISettingsRunbooksStore,
    { id: string },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<IApiProvider | null>
  >;

  retrieveDatabase: Thunk<
    ISettingsRunbooksStore,
    { id: string },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<IRunbookDatabase | null>
  >;

  removeApiProvider: Thunk<
    ISettingsRunbooksStore,
    { id: string },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<void>
  >;

  updateApiProvider: Thunk<
    ISettingsRunbooksStore,
    { id: string; provider: IApiProvider },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<boolean>
  >;

  updateDatabase: Thunk<
    ISettingsRunbooksStore,
    { id: string; database: IRunbookDatabase },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<void>
  >;

  createApiProvider: Thunk<
    ISettingsRunbooksStore,
    { provider: IApiProvider },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<boolean>
  >;

  removeDatabase: Thunk<
    ISettingsRunbooksStore,
    { id: string },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<void>
  >;

  createDatabase: Thunk<
    ISettingsRunbooksStore,
    { database: IRunbookDatabase },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<void>
  >;

  autoUpdateApiProvider: Thunk<
    ISettingsRunbooksStore,
    { id: string; provider: IApiProvider },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<void>
  >;

  autoUpdateDatabase: Thunk<
    ISettingsRunbooksStore,
    { id: string; database: IRunbookDatabase },
    IStoreInjections,
    ISettingsRunbooksStore,
    Promise<void>
  >;
}

export const settingsRunbooksStore: ISettingsRunbooksStore = {
  retrieveAllObjects: thunk(
    async (actions, payload, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);
      const [providers, databases] = await Promise.all([
        settingsService.runbooks.getAllApiProviders(),
        settingsService.runbooks.getAllDatabases(),
      ]);
      dispatchSetLoading(dispatch, false);

      return { providers, databases };
    },
  ),

  removeApiProvider: thunk(
    async (actions, { id }, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);
      await settingsService.runbooks.deleteApiProvider(id);
      dispatchSetLoading(dispatch, false);
    },
  ),

  removeDatabase: thunk(
    async (actions, { id }, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);
      await settingsService.runbooks.deleteDatabase(id);
      dispatchSetLoading(dispatch, false);
    },
  ),

  retrieveApiProvider: thunk(
    async (actions, { id }, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);

      try {
        const provider = await settingsService.runbooks.getApiProvider(id);
        dispatchSetLoading(dispatch, false);
        return provider;
      } catch (error) {
        console.error(error);
        dispatchSetLoading(dispatch, false);
        dispatchSet404(dispatch, true);
        return null;
      }
    },
  ),

  retrieveDatabase: thunk(
    async (actions, { id }, { injections: { settingsService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);

      try {
        const database = await settingsService.runbooks.getDatabase(id);
        dispatchSetLoading(dispatch, false);
        return database;
      } catch (error) {
        console.error(error);
        dispatchSetLoading(dispatch, false);
        dispatchSet404(dispatch, true);
        return null;
      }
    },
  ),

  updateApiProvider: thunk(
    async (
      actions,
      { id, provider },
      { injections: { settingsService }, dispatch },
    ) => {
      let result = true;
      dispatchSetLoading(dispatch, true);

      try {
        await settingsService.runbooks.setApiProvider(id, provider);
      } catch (error) {
        const { response } = errorToAxiosError(error);
        dispatchAddError(
          dispatch,
          `Failed to save. Please try again. ${response?.data.reason}`,
        );

        result = false;
      }

      dispatchSetLoading(dispatch, false);
      return result;
    },
  ),

  updateDatabase: thunk(
    async (
      actions,
      { id, database },
      { injections: { settingsService }, dispatch },
    ) => {
      dispatchSetLoading(dispatch, true);
      try {
        await settingsService.runbooks.patchDatabase(id, database);
      } catch (error) {
        const { response } = errorToAxiosError(error);
        // istanbul ignore next
        dispatchAddError(
          dispatch,
          `Failed to save. Please try again. ${response?.data?.reason}`,
        );
      }

      dispatchSetLoading(dispatch, false);
    },
  ),

  createApiProvider: thunk(
    async (
      actions,
      { provider },
      { injections: { settingsService }, dispatch },
    ) => {
      let result = true;
      dispatchSetLoading(dispatch, true);

      try {
        await settingsService.runbooks.postApiProvider(provider);
      } catch (error) {
        const { response } = errorToAxiosError(error);

        dispatchAddError(
          dispatch,
          `Failed to save. Please try again. ${response?.data.reason}`,
        );

        result = false;
      }

      dispatchSetLoading(dispatch, false);
      return result;
    },
  ),

  createDatabase: thunk(
    async (
      actions,
      { database },
      { injections: { settingsService }, dispatch },
    ) => {
      dispatchSetLoading(dispatch, true);

      try {
        await settingsService.runbooks.postDatabase(database);
      } catch (error) {
        const { response } = errorToAxiosError(error);
        dispatchAddError(
          dispatch,
          `Failed to save. Please try again. ${response?.data.reason}`,
        );
      }

      dispatchSetLoading(dispatch, false);
    },
  ),

  autoUpdateApiProvider: thunk(
    async (
      actions,
      { id, provider },
      { injections: { settingsService }, dispatch },
    ) => {
      AUTO_SAVE_DEBOUNCE.run(async () => {
        dispatchSetLoading(dispatch, false);

        try {
          await settingsService.runbooks.setApiProvider(id, provider);
        } catch (error) {
          const { response } = errorToAxiosError(error);
          dispatchAddError(
            dispatch,
            `Failed to save. Please try again. ${response?.data.reason}`,
          );
        }

        dispatchSetLoading(dispatch, false);
      });
    },
  ),

  autoUpdateDatabase: thunk(
    async (
      actions,
      { id, database },
      { injections: { settingsService }, dispatch },
    ) => {
      AUTO_SAVE_DEBOUNCE.run(async () => {
        dispatchSetLoading(dispatch, false);

        try {
          await settingsService.runbooks.patchDatabase(id, database);
        } catch (error) {
          const { response } = errorToAxiosError(error);
          dispatchAddError(
            dispatch,
            `Failed to save. Please try again. ${response?.data.reason}`,
          );
        }

        dispatchSetLoading(dispatch, false);
      });
    },
  ),
};
