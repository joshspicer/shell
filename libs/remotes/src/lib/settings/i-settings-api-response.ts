export interface ISettingsApiResponse {
  certificate_authority: boolean;
  hostname: string;
  github_repos: number;

  shell: {
    reason_required: boolean;
    record_output: boolean;
    ca_enabled: boolean;
    gh_app_id: number | null;
    gh_app_url: string | null;
  };
  ssh: {
    public_key: string;
    principal_name: string;
    certificate_authentication: boolean;
    organization_name: string;
    instruction_text: string;
  };
}

export interface ISettingsLogSessionApiResponse {
  id: number;
  start_time: string;
  end_time?: string;
  ip_address: string;

  metadata_: {
    session_id: string;
    human_location: string;
    target_host: string;
  };

  creator: {
    email: string;
  };

  runbook?: {
    id: number;
    name: string;
  };

  approval?: {
    id: number;
    reason: string;
  };
}

export interface ISettingsLogsApiResponse {
  data: {
    user: {
      id: number;
      name: string;
      email: string;
    };

    group: {
      id: number;
      name: string;
    };

    sessions: ISettingsLogSessionApiResponse[];
  };
}

export interface IGetGroupResponse {
  group: {
    id: number;
    name: string;
  };

  group_users: {
    id: number;
    email: string;
    admin: boolean;
  }[];
}
