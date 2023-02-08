import { axiosInstance } from '../axios';
import type { IUser } from '../remotes';
import { settingsApprovalsService } from './approvals/settings-approvals.service';
import {
  ISettings,
  ISettingsPromptAccess,
  ISettingsGroup,
  ISettingsUser,
  ISettingsUserResponse,
  ILog,
  IGroupDetails,
} from './i-settings';
import {
  IGetGroupResponse,
  ISettingsApiResponse,
  ISettingsLogsApiResponse,
} from './i-settings-api-response';
import { settingsRunbooksService } from './runbooks/settings-runbooks.service';
import { transformLogs } from './settings-service.utilities';

const connectToGitHub = async (data: { code: string; state: string }) => {
  const {
    data: { connected },
  } = await axiosInstance.get<{ connected: boolean }>(
    `/api/github/app-manifest-conversion?code=${data.code}&state=${data.state}`,
  );

  return {
    connected,
  };
};

const disconnectFromGitHub = async () => {
  await axiosInstance.delete('/api/github/app-manifest-conversion');
};

const getAllSettings = async (): Promise<ISettings> => {
  const {
    data: {
      certificate_authority: certificateAuthority,
      shell: {
        ca_enabled: certificateAuthentication,
        reason_required: reasonRequired,
        record_output: recordOutput,
        gh_app_id: ghAppId,
        gh_app_url: ghAppUrl,
      },
      github_repos: githubRepos,
      ssh: {
        public_key: publicKey,
        principal_name: principalName,
        certificate_authentication: certificate,
        organization_name: organizationName,
        instruction_text: instructionText,
      },
    },
  } = await axiosInstance.get<ISettingsApiResponse>('/api/casedshell');

  return {
    certificateAuthority,
    certificateAuthentication,
    ssh: {
      publicKey,
      principalName,
      certificate,
      organizationName,
      instructionText,
    },
    shell: {
      reasonRequired,
      recordOutput,
      caEnabled: certificateAuthentication,
      ghAppId,
      ghAppUrl,
    },
    githubRepos,
  };
};

const setCaEnabled = async (caEnabled: boolean): Promise<boolean> => {
  const result = await axiosInstance.patch<{
    casedshell: { ca_enabled: boolean };
  }>('/api/casedshell', {
    ca_enabled: caEnabled,
  });

  return result.data.casedshell.ca_enabled;
};

const getGroupsAndUsers = async (): Promise<{
  groups: ISettingsGroup[];
  users: ISettingsUser[];
}> => {
  const [
    {
      data: { group },
    },
    {
      data: { users },
    },
  ] = await Promise.all([
    await axiosInstance.get<{
      group: { id: number; name: string; group_user: unknown[] }[];
    }>('/api/groups'),
    await axiosInstance.get<{ users: ISettingsUserResponse[] }>('/api/users'),
  ]);

  return {
    groups: group.map((g) => ({
      id: g.id.toString(),
      name: g.name,
      users: g.group_user.length,
    })),

    users: users.map((u) => ({
      id: u.id.toString(),
      name: u.name,
      created: new Date(u.created_at),
      role: u.admin ? 'Admin' : 'User',
    })),
  };
};

const setUserRole = async (
  id: string,
  role: string,
): Promise<ISettingsUser> => {
  const {
    data: {
      user: { name, created_at: created, admin },
    },
  } = await axiosInstance.patch<{ user: ISettingsUserResponse }>(
    `/api/users/${id}`,
    {
      admin: role === 'Admin',
    },
  );

  return {
    id,
    name,
    created: new Date(created),
    role: admin ? 'Admin' : 'User',
  };
};

const getPromptAccess = async (): Promise<ISettingsPromptAccess> => {
  const {
    data: {
      data: { user_accesses: users, group_accesses: groups },
    },
  } = await axiosInstance.get<{
    data: { user_accesses: object; group_accesses: object };
  }>('/api/prompt-access');

  return {
    user: JSON.stringify(users),
    group: JSON.stringify(groups),
  };
};

const setPromptAccess = async (
  value: object,
  type: 'user' | 'group',
): Promise<void> => {
  await axiosInstance.post(`/api/prompt-access?type=${type}`, value);
};

const getUserLogs = async (
  id: string,
): Promise<{ user: IUser; logs: ILog[] }> => {
  const {
    data: {
      data: { user, sessions: allSessions },
    },
  } = await axiosInstance.get<ISettingsLogsApiResponse>(
    `/api/sessions/users/${id}`,
  );

  return {
    user: { ...user, id: user.id.toString() },
    logs: transformLogs(allSessions),
  };
};

const getGroupLogs = async (id: string): Promise<ILog[]> => {
  const {
    data: {
      data: { sessions: allSessions },
    },
  } = await axiosInstance.get<ISettingsLogsApiResponse>(
    `/api/sessions/groups/${id}`,
  );

  return transformLogs(allSessions);
};

const setReasonRequired = async (reasonRequired: boolean): Promise<boolean> => {
  const result = await axiosInstance.patch<{
    casedshell: { reason_required: boolean };
  }>('/api/casedshell', {
    reason_required: reasonRequired,
  });

  return result.data.casedshell.reason_required;
};

const setRecordOutput = async (recordOutput: boolean): Promise<boolean> => {
  const result = await axiosInstance.patch<{
    casedshell: { record_output: boolean };
  }>('/api/casedshell', {
    record_output: recordOutput,
  });

  return result.data.casedshell.record_output;
};

const getGroupDetails = async (id: string): Promise<IGroupDetails> => {
  const {
    data: { group, group_users: users },
  } = await axiosInstance.get<IGetGroupResponse>(`/api/groups/${id}`);

  return {
    name: group.name,
    id: group.id.toString(),

    members: users.map(({ id: userId, email, admin }) => ({
      id: userId.toString(),
      email,
      role: admin ? 'Admin' : 'User',
    })),
  };
};

export const settingsService = {
  connectToGitHub,
  disconnectFromGitHub,
  getAllSettings,
  setCaEnabled,
  getGroupsAndUsers,
  setUserRole,
  getPromptAccess,
  setPromptAccess,
  getUserLogs,
  setReasonRequired,
  setRecordOutput,
  approvals: settingsApprovalsService,
  getGroupLogs,
  getGroupDetails,
  runbooks: settingsRunbooksService,
};
