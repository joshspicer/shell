/* eslint-disable @typescript-eslint/naming-convention */
import { AllBlocks, INodeRunResultData, INodeRunData } from '@cased/data';
import { axiosInstance } from '../axios';

export interface IRunbookResponse {
  id: number;
  name: string;
  description: string;
  blocks: AllBlocks[];
}

export interface IRunbookGetAllResponse {
  runbooks: {
    id: number;
    name: string;
    description: string;
    last_run: string | null;
  }[];
}

export interface IRunbookGetResponse {
  runbook: IRunbookResponse;

  databases: {
    id: string;
    label: string;
  }[];

  prompts: {
    slug: string;
  }[];

  api_providers: {
    id: string;
    api_name: string;
  }[];
}

interface IBlockPostResponse {
  block: AllBlocks;
}

const getAll = async () => {
  const {
    data: { runbooks },
  } = await axiosInstance.get<IRunbookGetAllResponse>('/api/runbooks');

  const runbooksCamelCase = runbooks.map(
    ({ id, last_run, description, name }) => ({
      id,
      lastRun: last_run,
      description,
      name,
    }),
  );

  return { runbooks: runbooksCamelCase };
};

const create = async (name: string, description: string) => {
  const {
    data: { runbook },
  } = await axiosInstance.post<{ runbook: IRunbookResponse }>(`/api/runbooks`, {
    runbook: { name, description },
  });

  return {
    runbook,
  };
};

const get = async (id: string) => {
  const {
    data: { runbook, prompts, databases, api_providers },
  } = await axiosInstance.get<IRunbookGetResponse>(`/api/runbooks/${id}`);

  return {
    runbook,
    prompts,
    databases,
    apiProviders: api_providers,
  };
};

const run = async (id: string, data: { runData: INodeRunData }) => {
  const {
    data: { result },
  } = await axiosInstance.post<{
    result: INodeRunResultData;
  }>(`/api/runbooks/${id}/run`, data);

  return { result };
};

const createBlock = async (data: AllBlocks) => {
  const {
    data: { block },
  } = await axiosInstance.post<IBlockPostResponse>(`/api/blocks`, {
    block: data,
  });

  return {
    block,
  };
};

const updateBlock = async (data: AllBlocks) => {
  const {
    data: { block },
  } = await axiosInstance.patch<IBlockPostResponse>(
    `/api/blocks/${data.id}/update`,
    { block: data },
  );

  return {
    block,
  };
};

const deleteBlock = async (id: string) => {
  await axiosInstance.delete(`/api/blocks/${id}/destroy`);
};

export const runbooksService = {
  getAll,
  create,
  get,
  run,
  createBlock,
  updateBlock,
  deleteBlock,
};
