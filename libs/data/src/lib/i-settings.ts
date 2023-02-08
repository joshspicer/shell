export interface ISettings {
  certificateAuthentication: boolean;
  certificateAuthority: boolean;
  ssh: ISettingsSsh;
  shell: ICasedShellData;
  githubRepos: number;
}

export interface ISettingsSsh {
  publicKey: string;
  principalName: string;
  certificate: boolean;
  organizationName: string;
  instructionText: string;
}

export interface ICasedShellData {
  reasonRequired?: boolean;
  recordOutput?: boolean;
  caEnabled?: boolean;
  ghAppId?: number | null;
  ghAppUrl?: string | null;
}

export interface ISettingsGroup {
  id: string;
  name: string;
  users: number;
}

export interface ISettingsUser {
  id: string;
  name: string;
  created: Date;
  // @TODO Convert to enum for sanity reasons
  role: string;
}

export interface ISettingsUserResponse {
  id: number;
  admin: boolean;
  name: string;
  created_at: string;
}

export interface ISettingsPromptAccess {
  user: string;
  group: string;
}

export interface ILog {
  id: string;
  email: string;
  location: string;
  host: string;
  ip: string;

  runbook?: {
    id: string;
    name: string;
    date: Date;
  };

  session?: {
    id: string;
    startTime: Date;
    endTime?: Date;
  };

  approval?: {
    id: string;
    reason: string;
  };
}

export interface IGroupDetails {
  id: string;
  name: string;

  members: {
    id: string;
    email: string;
    role: string;
  }[];
}
