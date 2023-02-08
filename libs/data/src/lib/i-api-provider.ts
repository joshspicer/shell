export interface IEntry {
  id: string;
  name: string;
}

export interface IRunbookDatabase extends IEntry {
  host?: string;
  port?: string;
  label?: string;
  username?: string;
  password?: string;
  hasPassword?: boolean;
}

export interface IApiProvider extends IEntry {
  baseUrl?: string;
  authType: 'basic' | 'token';
  username?: string;
  password?: string;
  authToken?: string;
  secretToken?: string;
  hasPassword?: boolean;
  hasToken?: boolean;
}
