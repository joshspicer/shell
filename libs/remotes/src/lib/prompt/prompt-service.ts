import { IPrompt, IPromptForm, IPromptMoreInfoForm } from '@cased/data';
import { errorToAxiosError } from '@cased/utilities';
import { AxiosError } from 'axios';
import { axiosInstance } from '../axios';
import { transformPrompts } from './prompt-service.utilities';

export type IPromptAPIResponse = {
  featured: boolean;
  name: string;
  description: string;
  slug: string;
  needs_more_info: boolean;
  ip_address: string;
  hostname: string;
  port: number;
  close_terminal_on_exit: boolean;
  username: string;
  labels: { [key: string]: string };
  session_id: string;
  certificate_authentication: boolean;
  need_access: boolean;
  needs_authentication: boolean;
  authorized_for_authenticated_principals: boolean;
  authorization_explanation: string;
  approval_required: boolean;
};

export class PromptAccessError extends Error {
  constructor(public slug: string) {
    super(`Prompt ${slug} requires approval.`);
    this.name = 'PromptAccessError';
  }
}

export const promptService = {
  getAll: async (): Promise<IPrompt[]> => {
    const {
      data: { prompts },
    } = await axiosInstance.get<{ prompts: IPromptAPIResponse[] }>(
      '/v2/api/prompts',
    );

    return transformPrompts(prompts);
  },

  get: async (slug: string): Promise<IPromptForm> => {
    const { data } = await axiosInstance.get<{ prompt: IPromptForm }>(
      `/v2/api/prompts/${slug}`,
    );
    return data.prompt;
  },

  getWebSocketUrl: async (
    slug: string,
    approvalStatus: string,
    data: IPromptMoreInfoForm,
  ) => {
    const formData = new FormData();
    if (data.privateKey) formData.append('privatekey', data.privateKey);
    if (data.passphrase) formData.append('passphrase', data.passphrase);
    if (data.username) formData.append('username', data.username);
    if (data.reason) formData.append('reason', data.reason);
    formData.append('slug', slug);
    const status = data.approvalStatus || approvalStatus;
    formData.append('approval_status', status);

    const response = await axiosInstance.post(
      '/v2/api/prompt-sessions',
      formData,
    );

    const shellInfo = response.data;
    const errorMessage = shellInfo.status;

    // istanbul ignore else
    if (response.status === 401) {
      throw new PromptAccessError(slug);
    } else if (response.status !== 200) {
      throw new Error(`Something went wrong: ${errorMessage}`);
    } else if (!shellInfo.session_id || !shellInfo.id) {
      console.error(
        'Response is empty when establishing websocket connection. Aborting connection. Connection info',
        slug,
        approvalStatus,
        data,
        formData,
        response,
      );

      throw new Error(
        `Shell connection failed. Data missing. ${errorMessage}. See logs for details`,
      );
    }

    const url = new URL(
      `/v2/ws/${shellInfo.session_id}/${shellInfo.id}`,
      axiosInstance.defaults.baseURL,
    );
    url.protocol = 'wss';

    return { url: url.href, promptSessionId: shellInfo.session_id };
  },

  getWebSocketShareUrl: (promptSessionId: string) => {
    const shareUrl = new URL(
      `/v2/ws/share/${promptSessionId}`,
      axiosInstance.defaults.baseURL,
    );
    shareUrl.protocol = 'wss';

    return shareUrl.href;
  },

  download: async (filepath: string, promptSlug: string) => {
    const data = { filepath, promptSlug };
    try {
      const response = await axiosInstance.post(`/api/downloads`, data);
      return response.data;
    } catch (error) {
      let reason;

      // istanbul ignore next
      if (error instanceof AxiosError) {
        reason = errorToAxiosError(error).response?.data.reason;
      }
      throw new Error(reason || `Download failed.`);
    }
  },

  upload: async (file: File, promptSlug: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', promptSlug);
    try {
      return (await axiosInstance.post(`/api/uploads`, formData)).data;
    } catch (error) {
      let reason;

      // istanbul ignore next
      if (error instanceof AxiosError) {
        reason = errorToAxiosError(error).response?.data.reason;
      }
      throw new Error(reason || `Upload failed.`);
    }
  },
};
