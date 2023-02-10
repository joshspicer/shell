import { ILog } from '@cased/data';
import { ISettingsLogSessionApiResponse } from './i-settings-api-response';

export const transformLogs = (logs: ISettingsLogSessionApiResponse[]): ILog[] =>
  logs.map(
    ({
      id: logId,
      start_time: startTime,
      end_time: endTime,
      creator: { email },
      metadata_: {
        human_location: location,
        target_host: host,
        session_id: sessionId,
      },
      ip_address: ip,
      runbook,
      approval,
    }) => {
      const payload: ILog = {
        id: logId.toString(),
        email,
        location,
        host,
        ip,
      };

      if (runbook) {
        payload.runbook = {
          id: runbook.id.toString(),
          name: runbook.name,
          date: new Date(startTime),
        };
      } else {
        payload.session = {
          id: sessionId,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : undefined,
        };
      }

      if (approval) {
        payload.approval = {
          id: approval.id.toString(),
          reason: approval?.reason,
        };
      }

      return payload;
    },
  );
