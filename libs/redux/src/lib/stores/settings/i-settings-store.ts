import { Thunk, Action } from 'easy-peasy';
import {
  ILog,
  ISettings,
  ISettingsGroup,
  ISettingsSsh,
  ISettingsUser,
  ICasedShellData,
  IGroupDetails,
  IUser,
} from '@cased/data';
import type { IStoreInjections } from '../store';

export interface ISettingsStore {
  organization: string;
  shell: ICasedShellData;
  githubRepos: number;
  certificateAuthentication: boolean;
  certificateAuthority: boolean;
  ssh: ISettingsSsh;

  users: ISettingsUser[];
  userAccess: string;
  userLogs: ILog[];
  userLogsAuthor: IUser;

  groups: ISettingsGroup[];
  groupAccess: string;
  groupLogs: ILog[];
  groupDetails: IGroupDetails;

  // @TODO Rename setGroup
  set: Action<ISettingsStore, Partial<ISettings>>;
  // @TODO Rename setAllGroups
  setGroups: Action<ISettingsStore, ISettingsGroup[]>;
  setGroupAccess: Action<ISettingsStore, string>;
  setGroupLogs: Action<ISettingsStore, ILog[]>;
  setGroupDetails: Action<ISettingsStore, IGroupDetails>;

  // @TODO Rename as setAllUsers
  setUsers: Action<ISettingsStore, ISettingsUser[]>;
  setUser: Action<ISettingsStore, { id: string; user: ISettingsUser }>;
  setUserAccess: Action<ISettingsStore, string>;
  setUserLogs: Action<ISettingsStore, { user: IUser; logs: ILog[] }>;
  setOrganization: Action<ISettingsStore, { organization: string }>;
  setCertificateAuthentication: Thunk<
    ISettingsStore,
    { enable: boolean },
    IStoreInjections
  >;
  setReasonRequired: Thunk<
    ISettingsStore,
    { required: boolean },
    IStoreInjections
  >;
  setRecordOutput: Thunk<ISettingsStore, { record: boolean }, IStoreInjections>;

  populateGroupLogs: Thunk<ISettingsStore, { id: string }, IStoreInjections>;
  populateUserLogs: Thunk<ISettingsStore, { id: string }, IStoreInjections>;
  populateShell: Thunk<ISettingsStore, void, IStoreInjections>;
  populateGroupsAndUsers: Thunk<ISettingsStore, void, IStoreInjections>;
  populateGroupDetails: Thunk<ISettingsStore, { id: string }, IStoreInjections>;

  connectGitHub: Thunk<ISettingsStore, void, IStoreInjections>;
  disconnectGitHub: Thunk<ISettingsStore, void, IStoreInjections>;

  updateUserAccess: Thunk<ISettingsStore, { value: string }, IStoreInjections>;
  updateGroupAccess: Thunk<ISettingsStore, { value: string }, IStoreInjections>;
  updateUserRole: Thunk<
    ISettingsStore,
    { id: string; role: string },
    IStoreInjections
  >;
}
