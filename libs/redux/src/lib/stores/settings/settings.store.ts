import { action } from 'easy-peasy';
import { ISettingsStore } from './i-settings-store';
import { settingsThunks } from './settings.thunks';

export const settingsStore: ISettingsStore = {
  organization: '',
  shell: {
    reasonRequired: false,
    caEnabled: false,
    recordOutput: false,
    ghAppUrl: '',
    ghAppId: null,
  },

  githubRepos: 0,
  certificateAuthentication: false,
  certificateAuthority: false,

  users: [],
  userAccess: '',
  userLogs: [],
  userLogsAuthor: {},

  groups: [],
  groupAccess: '',
  groupLogs: [],
  groupDetails: {
    id: '',
    name: '',
    members: [],
  },

  ssh: {
    publicKey: '',
    principalName: '',
    certificate: false,
    organizationName: '',
    instructionText: '',
  },

  setOrganization: action((state, { organization }) => {
    state.organization = organization;
  }),

  set: action(
    (
      state,
      {
        certificateAuthentication,
        certificateAuthority,
        ssh,
        shell,
        githubRepos,
      },
    ) => {
      if (certificateAuthentication !== undefined)
        state.certificateAuthentication = certificateAuthentication;

      if (certificateAuthority !== undefined)
        state.certificateAuthority = certificateAuthority;

      if (ssh !== undefined) state.ssh = ssh;

      if (shell !== undefined) state.shell = shell;

      if (githubRepos !== undefined) state.githubRepos = githubRepos;
    },
  ),

  setGroups: action((state, groups) => {
    state.groups = groups;
  }),

  setGroupAccess: action((state, groupAccess) => {
    state.groupAccess = groupAccess;
  }),

  setUsers: action((state, users) => {
    state.users = users;
  }),

  setUser: action((state, { id, user }) => {
    state.users = state.users.map((u) => (u.id === id ? user : u));
  }),

  setUserLogs: action((state, { user, logs }) => {
    state.userLogs = logs;
    state.userLogsAuthor = user;
  }),

  setGroupLogs: action((state, groupLogs) => {
    state.groupLogs = groupLogs;
  }),

  setUserAccess: action((state, userAccess) => {
    state.userAccess = userAccess;
  }),

  setGroupDetails: action((state, groupDetails) => {
    state.groupDetails = groupDetails;
  }),

  ...settingsThunks,
};
