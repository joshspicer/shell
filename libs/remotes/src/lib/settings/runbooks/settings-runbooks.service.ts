import { IApiProvider, IEntry, IRunbookDatabase } from '@cased/data';
import { axiosInstance } from '../../axios';

const getAllApiProviders = async (): Promise<IEntry[]> => {
  const {
    data: { api_providers: apiProviders },
  } = await axiosInstance.get<{
    api_providers: { id: number; api_name: string }[];
  }>('/api/api_providers');

  return apiProviders.map(({ id, api_name: name }) => ({
    id: id.toString(),
    name,
  }));
};

const getApiProvider = async (id: string): Promise<IApiProvider> => {
  const {
    data: {
      api_provider: {
        api_name: name,
        base_url: baseUrl,
        authentication_type: authType,
        data,
      },
      pw: hasPassword,
    },
  } = await axiosInstance.get<{
    api_provider: {
      api_name: string;
      base_url: string;
      authentication_type?: 'basic' | 'token' | null;
      data?: {
        username?: string;
        password?: string;
        auth_token?: string;
        secret_token?: string;
      };
    };
    pw?: boolean;
  }>(`/api/api_providers/${id}`);

  const username = data?.username || '';
  const authToken = data?.auth_token || '';

  return {
    id,
    name,
    baseUrl,
    authType: authType || 'basic',
    username,
    hasPassword: hasPassword && authType === 'basic',
    hasToken: hasPassword && authType === 'token',
    authToken,
  };
};

const getDatabase = async (id: string): Promise<IRunbookDatabase> => {
  const {
    data: {
      database: { name = '', host = '', port = '', label = '', username = '' },
      pw: hasPassword,
    },
  } = await axiosInstance.get<{
    database: {
      name: string;
      host: string;
      port: string;
      label: string;
      username: string;
    };
    pw: boolean;
  }>(`/api/databases/${id}`);

  return {
    id,
    name,
    host,
    port,
    label,
    username,
    hasPassword,
  };
};

const setApiProvider = async (
  id: string,
  apiProvider: IApiProvider,
): Promise<void> => {
  const {
    name,
    baseUrl,
    authType,
    username,
    password,
    authToken,
    secretToken,
  } = apiProvider;

  await axiosInstance.patch(`/api/api_providers/${id}`, {
    api_name: name,
    base_url: baseUrl,
    authentication_type: authType,
    username,
    password,
    auth_token: authToken,
    secret_token: secretToken,
  });
};

const patchDatabase = async (
  id: string,
  database: IRunbookDatabase,
): Promise<void> => {
  const { name, host, port, label, username, password } = database;

  await axiosInstance.patch(`/api/databases/${id}`, {
    name,
    host,
    port,
    label,
    username,
    password,
  });
};

const deleteApiProvider = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/api_providers/${id}`);
};

const postApiProvider = async (apiProvider: IApiProvider): Promise<void> => {
  const {
    name,
    baseUrl,
    authType,
    username,
    password,
    authToken,
    secretToken,
  } = apiProvider;

  await axiosInstance.post('/api/api_providers', {
    api_name: name,
    base_url: baseUrl,
    authentication_type: authType,
    username,
    password,
    auth_token: authToken,
    secret_token: secretToken,
  });
};

const postDatabase = async (database: IRunbookDatabase): Promise<void> => {
  const { name, host, port, label, username, password } = database;

  await axiosInstance.post('/api/databases', {
    name,
    host,
    port,
    label,
    username,
    password,
  });
};

const getAllDatabases = async (): Promise<IEntry[]> => {
  const {
    data: { databases },
  } = await axiosInstance.get<{
    databases: { id: number; name: string }[];
  }>('/api/databases');

  return databases.map(({ id, name }) => ({
    id: id.toString(),
    name,
  }));
};

const deleteDatabase = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/databases/${id}`);
};

export const settingsRunbooksService = {
  getAllApiProviders,
  getApiProvider,
  setApiProvider,
  deleteApiProvider,
  getAllDatabases,
  deleteDatabase,
  postApiProvider,
  postDatabase,
  patchDatabase,
  getDatabase,
};
