import {
  IApprovalBase as IApproval,
  ApprovalType,
  IApprovalAccess,
  IApprovalProgram,
  IApprovalSettingsApiObject,
  IUserLabel,
} from '@cased/data';
import { axiosInstance } from '../../axios';

const getApprovals = async (): Promise<{
  programs: IApproval[];
  access: IApproval[];
}> => {
  const {
    data: {
      program_approval_settings: programs,
      access_approval_settings: access,
    },
  } = await axiosInstance.get<{
    program_approval_settings: {
      name: string;
      id: number;
    }[];
    access_approval_settings: { id: number; name: string }[];
  }>('/api/approval_settings');

  return {
    programs: programs.map(({ name, id }) => ({
      id: id.toString(),
      name,
    })),
    access: access.map(({ id, name }) => ({
      id: id.toString(),
      name,
    })),
  };
};

// We have to hack the IDs to talk to the API. As it has no idea what the IDs connect to (user or group). This is a hack and should be fixed at some point
const transformId = (id: number, email?: string) =>
  `${email ? 'user' : 'group'}-${id}`;

const getRestrictedUsers = (
  groups?: { id: number; name: string; email?: string }[],
  users?: { id: number; name: string; email?: string }[],
) => {
  if (!groups || !users)
    return { restrictedUsers: [], approvalType: ApprovalType.anyone };

  const allUsers =
    groups && users
      ? groups.concat(users).map((i) => ({
          ...i,
          id: transformId(i.id, i.email),
        }))
      : [];

  const approvalType = allUsers?.length
    ? ApprovalType.restrict
    : ApprovalType.anyone;

  return {
    approvalType,
    restrictedUsers: allUsers.map(({ id: userId, name }) => ({
      id: userId.toString(),
      name,
    })),
  };
};

const getApprovalProgram = async (id: string): Promise<IApprovalProgram> => {
  const {
    data: {
      data: {
        approval_settings: {
          program,
          reason_required: reasonRequired,
          deny_on_unreachable: blockNewSessions,
          peer_approval: approvalRequired,
          self_approval: allowSelfApproval,
          custom_commands: customAutoApprovedCommands,
          approval_duration: sessionApprovalDuration,
          approval_timeout: sessionRequestTimeout,
          authorized_approval_groups: authorizedApprovalGroups,
          authorized_approval_users: authorizedApprovalUsers,
        },
      },
    },
  } = await axiosInstance.get<{
    data: {
      approval_settings: IApprovalSettingsApiObject;
    };
  }>(`/api/approval_settings/${id}`);

  const { restrictedUsers, approvalType } = getRestrictedUsers(
    authorizedApprovalGroups,
    authorizedApprovalUsers,
  );

  return {
    id,
    name: program?.name || '',
    reasonRequired,
    blockNewSessions,
    approvalRequired,
    allowSelfApproval: allowSelfApproval || false,
    customAutoApprovedCommands: customAutoApprovedCommands || '',
    sessionApprovalDuration,
    sessionRequestTimeout,
    approvalType,
    restrictedUsers,
  };
};

const getApprovalAccess = async (id: string): Promise<IApprovalAccess> => {
  const {
    data: {
      data: {
        approval_settings: {
          prompt: name = '',
          reason_required: reasonRequired,
          deny_on_unreachable: blockNewSessions,
          peer_approval: approvalRequired,
          approval_duration: sessionApprovalDuration,
          approval_timeout: sessionRequestTimeout,
          authorized_approval_groups: authorizedApprovalGroups,
          authorized_approval_users: authorizedApprovalUsers,
          self_approval: allowSelfApproval,
        },
      },
    },
  } = await axiosInstance.get<{
    data: {
      approval_settings: IApprovalSettingsApiObject;
    };
  }>(`/api/approval_settings/${id}`);

  const { restrictedUsers, approvalType } = getRestrictedUsers(
    authorizedApprovalGroups,
    authorizedApprovalUsers,
  );

  return {
    id,
    name,
    reasonRequired,
    blockNewSessions,
    approvalRequired,
    sessionApprovalDuration,
    sessionRequestTimeout,
    restrictedUsers,
    approvalType,
    allowSelfApproval,
  };
};

const setApprovalProgram = async (
  id: string,
  payload: IApprovalProgram,
): Promise<void> => {
  const transform: IApprovalSettingsApiObject = {
    reason_required: payload.reasonRequired,
    deny_on_unreachable: payload.blockNewSessions,
    peer_approval: payload.approvalRequired,
    self_approval: payload.allowSelfApproval,
    custom_commands: payload.customAutoApprovedCommands,
    approval_duration: payload.sessionApprovalDuration,
    approval_timeout: payload.sessionRequestTimeout,
    name: payload.name,
  };

  await axiosInstance.patch(`/api/approval_settings/${id}`, transform);
};

const setApprovalAccess = async (
  id: string,
  payload: IApprovalAccess,
): Promise<void> => {
  const transform: IApprovalSettingsApiObject = {
    reason_required: payload.reasonRequired,
    deny_on_unreachable: payload.blockNewSessions,
    peer_approval: payload.approvalRequired,
    approval_duration: payload.sessionApprovalDuration,
    approval_timeout: payload.sessionRequestTimeout,
    self_approval: payload.allowSelfApproval,
  };

  await axiosInstance.patch(`/api/approval_settings/${id}`, transform);
};

const deleteProgramApproval = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/approval_settings/${id}`);
};

const createProgramApproval = async (
  path: string,
  name?: string,
): Promise<{ id: string }> => {
  const {
    data: {
      data: {
        approval_setting: { id },
      },
    },
  } = await axiosInstance.post<{
    data: {
      approval_setting: { id: number };
    };
  }>('/api/approval_settings', {
    path,
    name,
  });

  return { id: id.toString() };
};

const getApprovalUsersSearch = async (
  id: string,
  search: string,
): Promise<IUserLabel[]> => {
  const {
    data: { data: users },
  } = await axiosInstance.get<{
    data: {
      id: number;
      name: string;
      email?: string;
    }[];
  }>(`/api/approval_settings/${id}/authorized_responders?q=${search}`);

  return users.map(({ id: userId, name, email }) => ({
    id: transformId(userId, email),
    name,
  }));
};

const addAuthorizedUser = async (
  programApprovalId: string,
  userId: string,
): Promise<void> => {
  await axiosInstance.post(
    `/api/approval_settings/${programApprovalId}/authorized_responders`,
    {
      id: userId,
    },
  );
};

const removeAuthorizedUser = async (
  programApprovalId: string,
  userId: string,
): Promise<void> => {
  await axiosInstance.delete(
    `/api/approval_settings/${programApprovalId}/authorized_responders?id=${userId}`,
  );
};

export const settingsApprovalsService = {
  getApprovals,
  deleteProgramApproval,
  createProgramApproval,
  getApprovalProgram,
  setApprovalProgram,
  setApprovalAccess,
  getApprovalAccess,
  getApprovalUsersSearch,
  addAuthorizedUser,
  removeAuthorizedUser,
};
