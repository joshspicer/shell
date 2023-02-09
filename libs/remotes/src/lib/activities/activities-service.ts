import { ILog } from '@cased/data';
import { saveAs } from 'file-saver';
import { axiosInstance } from '../axios';
import { ISettingsLogsApiResponse } from '../settings/i-settings-api-response';
import { transformLogs } from '../settings/settings-service.utilities';

export const activitiesService = {
  getAll: async (): Promise<ILog[]> => {
    const {
      data: {
        data: { sessions: allSessions },
      },
    } = await axiosInstance.get<ISettingsLogsApiResponse>(`/api/sessions`);

    return transformLogs(allSessions);
  },
  export: async () => {
    const { data } = await axiosInstance.get<ArrayBuffer>('/api/sessions', {
      responseType: 'blob',
    });

    const octetBlob = new Blob([data]);
    saveAs(octetBlob, 'sessions.json');
  },
};
