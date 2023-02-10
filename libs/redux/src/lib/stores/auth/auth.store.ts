import { action, thunk, Action, Thunk, computed, Computed } from 'easy-peasy';
import jwtDecode from 'jwt-decode';
import { TOKEN_ACCESS_ID, TOKEN_REFERSH_ID } from '@cased/remotes';
import { IUser } from '@cased/data';
import {
  dispatchNotification,
  NotificationType,
} from '../notifications/notifications.store';
import { dispatchSetLoading } from '../loading/loading.store';
import type { IStore, IStoreInjections } from '../store';

export const EXAMPLE_RESTORE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsImVtYWlsIjoiMTIzNDU2Nzg5MCIsInJvbGUiOiJhZG1pbiJ9.YLtIPmHhhkXhY5ilbK7urNkhDKw9l7huvCAnsG5SNao';

interface IUserJwtTokenDecode {
  user_id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface IAuthStore {
  refreshToken: string | null;
  accessToken: string | null;
  restoreComplete: boolean;

  user: Computed<IAuthStore, IUser | null>;

  setRestoreComplete: Action<IAuthStore, { complete: boolean }>;
  setAccessToken: Action<IAuthStore, { token: string | null }>;
  setRefreshToken: Action<IAuthStore, { refresh: string | null }>;

  login: Thunk<IAuthStore, { email: string }, IStoreInjections>;
  loginOpenSource: Thunk<
    IAuthStore,
    { email: string; password: string },
    IStoreInjections,
    IStore,
    Promise<boolean>
  >;
  restore: Thunk<IAuthStore, undefined, IStoreInjections>;
  logout: Thunk<IAuthStore, undefined, IStoreInjections>;
  writeAccessToken: Thunk<IAuthStore, { token: string }, IStoreInjections>;
  writeRefreshToken: Thunk<IAuthStore, { refresh: string }, IStoreInjections>;
  retrieveCurrentUser: Thunk<
    IAuthStore,
    undefined,
    IStoreInjections,
    IStore,
    Promise<IUser>
  >;
}

export const authStore: IAuthStore = {
  refreshToken: null,
  accessToken: null,
  restoreComplete: false,

  user: computed((state) => {
    if (!state.accessToken) {
      return null;
    }

    const {
      user_id: id,
      email,
      role,
    } = jwtDecode<IUserJwtTokenDecode>(state.accessToken);

    return { id, email, role };
  }),

  setAccessToken: action((state, { token }) => {
    state.accessToken = token;
  }),

  setRefreshToken: action((state, { refresh }) => {
    state.refreshToken = refresh;
  }),

  setRestoreComplete: action((state, { complete }) => {
    state.restoreComplete = complete;
  }),

  writeAccessToken: thunk(
    async (
      actions,
      { token },
      { injections: { axiosService, storageService } },
    ) => {
      actions.setAccessToken({ token });
      axiosService.setToken(token);

      if (token) {
        storageService.set(TOKEN_ACCESS_ID, token);
      } else {
        storageService.remove(TOKEN_ACCESS_ID);
      }
    },
  ),

  writeRefreshToken: thunk(
    async (actions, { refresh }, { injections: { storageService } }) => {
      actions.setRefreshToken({ refresh });
      if (refresh) storageService.set(TOKEN_REFERSH_ID, refresh);
      else storageService.remove(TOKEN_REFERSH_ID);
    },
  ),

  login: thunk(
    async (actions, { email }, { injections: { authService }, dispatch }) => {
      dispatchSetLoading(dispatch, true);

      try {
        const { accessToken, refreshToken } = await authService.login(email);
        actions.writeAccessToken({ token: accessToken });
        actions.writeRefreshToken({ refresh: refreshToken });
      } catch (e) {
        dispatchNotification(
          dispatch,
          'Login failed. Please try again',
          NotificationType.Error,
        );
      }

      dispatchSetLoading(dispatch, false);
    },
  ),

  loginOpenSource: thunk(
    async (
      actions,
      { email, password },
      { injections: { authService }, dispatch },
    ) => {
      let result = true;
      dispatchSetLoading(dispatch, true);

      try {
        const { accessToken, refreshToken } = await authService.loginOpenSource(
          email,
          password,
        );
        actions.writeAccessToken({ token: accessToken });
        actions.writeRefreshToken({ refresh: refreshToken });
      } catch (e) {
        result = false;
        dispatchNotification(
          dispatch,
          'Login failed. Please try again',
          NotificationType.Error,
        );
      }

      dispatchSetLoading(dispatch, false);
      return result;
    },
  ),

  restore: thunk(
    async (
      actions,
      _,
      { injections: { authService, storageService }, dispatch },
    ) => {
      const accessToken = storageService.get(TOKEN_ACCESS_ID);
      const refreshToken = storageService.get(TOKEN_REFERSH_ID);
      if (!accessToken) {
        actions.setRestoreComplete({ complete: true });
        return;
      }

      if (refreshToken) {
        dispatchSetLoading(dispatch, true);

        const userData = jwtDecode<IUserJwtTokenDecode>(accessToken);
        try {
          const accessTokenNew = await authService.loginRefresh(
            refreshToken,
            userData.email,
          );

          actions.writeAccessToken({ token: accessTokenNew });
          actions.writeRefreshToken({ refresh: refreshToken });
        } catch (e) {
          // Do not create a public error to the user. Keep it confined to the console
          console.error('Failed to restore session');
        }

        dispatchSetLoading(dispatch, false);
      } else {
        /**
         * This should never be possible and can get the user
         * into a broken state where all API calls will fail.
         * Currently enabled so the existing SSR cookie system will work
         */
        actions.writeAccessToken({ token: accessToken });
        console.warn(
          'Logged in the user without a refresh token. This may result in broken API requests. Please dump your cookies and local storage to fix.',
        );
      }

      actions.setRestoreComplete({ complete: true });
    },
  ),

  logout: thunk(async (actions, _, { injections: { storageService } }) => {
    actions.setAccessToken({ token: null });
    actions.setRefreshToken({ refresh: null });
    actions.setRestoreComplete({ complete: false });

    storageService.clear();
  }),

  retrieveCurrentUser: thunk(
    async (
      actions,
      _,
      { injections: { usersService }, dispatch, getStoreState },
    ) => {
      // istanbul ignore next
      const id = getStoreState().auth.user?.id;

      // istanbul ignore next
      if (!id) throw new Error('Cannot be used unless a user is logged in');

      dispatchSetLoading(dispatch, true);
      const user = await usersService.get(id);
      dispatchSetLoading(dispatch, false);

      return user;
    },
  ),
};
