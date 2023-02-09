export interface IUserLabel {
  id: string;
  name: string;
}

export interface IApprovalBase {
  id: string;
  name: string;
}

export interface IApprovalAccess extends IApprovalBase {
  reasonRequired: boolean;
  blockNewSessions: boolean;
  sessionApprovalDuration: number;
  sessionRequestTimeout: number;

  // Combines authorized_approval_groups and authorized_approval_users
  approvalRequired: boolean;
  restrictedUsers: IUserLabel[];
  approvalType: ApprovalType;
  allowSelfApproval: boolean;
}

export enum ApprovalType {
  anyone = 'anyone',
  restrict = 'restrict',
}

export interface IApprovalProgram extends IApprovalAccess {
  customAutoApprovedCommands: string;
}

export interface IApprovalSettingsApiObject {
  name?: string;
  prompt?: string;
  reason_required: boolean;
  deny_on_unreachable: boolean;
  peer_approval: boolean;
  custom_commands?: string;
  approval_duration: number;
  approval_timeout: number;
  self_approval: boolean;

  authorized_approval_groups?: {
    id: number;
    name: string;
    email?: string;
  }[];

  authorized_approval_users?: {
    id: number;
    name: string;
    email?: string;
  }[];

  program?: {
    name: string;
  };
}
