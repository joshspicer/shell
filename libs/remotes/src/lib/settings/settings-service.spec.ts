import { A } from '@cased/test-utilities';
import { IGroupDetails } from '@cased/data';
import { settingsService } from './settings-service';
import { axiosInstance } from '../axios';
import { IGetGroupResponse } from './i-settings-api-response';

describe('settingsService', () => {
  describe('connectToGithub', () => {
    it('should connect to GitHub', async () => {
      const data = {
        state: '1234',
        code: 'github-code',
      };
      const response = Promise.resolve({ data: { connected: true } });

      jest.spyOn(axiosInstance, 'get').mockResolvedValueOnce(response);

      const { connected } = await settingsService.connectToGitHub(data);

      expect(connected).toEqual(true);
    });
  });
  describe('getAllSettings', () => {
    it('should transform the settings as expected', async () => {
      const data = {
        certificate_authority: true,
        shell: {
          ca_enabled: true,
          reason_required: true,
          record_output: true,
          gh_app_id: '1234',
          gh_app_url: '',
        },
        ssh: {
          public_key: 'publicKey',
          principal_name: 'principalName',
          certificate_authentication: true,
          organization_name: 'organizationName',
          instruction_text: 'instructionText',
        },
        github_repos: 0,
      };

      const response = Promise.resolve({ data });
      jest.spyOn(axiosInstance, 'get').mockResolvedValueOnce(response);
      const result = await settingsService.getAllSettings();

      expect(result).toEqual({
        certificateAuthority: true,
        certificateAuthentication: true,
        ssh: {
          publicKey: 'publicKey',
          principalName: 'principalName',
          certificate: true,
          organizationName: 'organizationName',
          instructionText: 'instructionText',
        },
        shell: {
          reasonRequired: true,
          recordOutput: true,
          caEnabled: true,
          ghAppId: '1234',
          ghAppUrl: '',
        },
        githubRepos: 0,
      });
    });
  });

  describe('setCaEnabled', () => {
    it('should return the casedshell.ca_enabled result from axiosInstance patch', async () => {
      const data = Promise.resolve({
        data: { casedshell: { ca_enabled: true } },
      });

      jest.spyOn(axiosInstance, 'patch').mockResolvedValueOnce(data);
      const result = await settingsService.setCaEnabled(true);

      expect(result).toEqual(true);
    });
  });

  describe('getGroupsAndUsers method', () => {
    it('should return the groups and users', async () => {
      const created = new Date();

      const groupResponse = {
        group: [
          {
            id: 1,
            name: 'group1',
            group_user: [{}, {}],
          },
        ],
      };

      const userResponse = {
        users: [
          {
            id: 1,
            admin: true,
            name: 'user1',
            created_at: created.toString(),
          },
        ],
      };

      const expected = {
        groups: [
          {
            name: 'group1',
            users: 2,
            id: '1',
          },
        ],
        users: [
          {
            name: 'user1',
            role: 'Admin',
            id: '1',
            created: expect.any(Date),
          },
        ],
      };

      jest.spyOn(axiosInstance, 'get').mockImplementation((url) => {
        if (url === '/api/groups') {
          return Promise.resolve({ data: groupResponse });
        }

        return Promise.resolve({ data: userResponse });
      });

      const result = await settingsService.getGroupsAndUsers();

      expect(result).toEqual(expected);
    });
  });

  describe('setReasonRequired', () => {
    it('should return the casedshell.reason_required result from axiosInstance patch', async () => {
      const data = Promise.resolve({
        data: { casedshell: { reason_required: true } },
      });

      jest.spyOn(axiosInstance, 'patch').mockResolvedValueOnce(data);
      const result = await settingsService.setReasonRequired(true);

      expect(result).toEqual(true);
    });
  });

  describe('setRecordOutput', () => {
    it('should return the casedshell.record_output result from axiosInstance patch', async () => {
      const data = Promise.resolve({
        data: { casedshell: { record_output: true } },
      });

      jest.spyOn(axiosInstance, 'patch').mockResolvedValueOnce(data);
      const result = await settingsService.setRecordOutput(true);

      expect(result).toEqual(true);
    });
  });

  describe('getGroupDetails method', () => {
    it('should return the group details formatted as expected', async () => {
      const data: IGetGroupResponse = {
        group: {
          id: 1,
          name: 'group1',
        },
        group_users: [
          {
            id: 1,
            email: 'asdf@asdf.com',
            admin: true,
          },
        ],
      };

      const expected: IGroupDetails = {
        id: '1',
        name: 'group1',
        members: [
          {
            id: '1',
            email: 'asdf@asdf.com',
            role: 'Admin',
          },
        ],
      };

      jest.spyOn(axiosInstance, 'get').mockResolvedValueOnce({
        data,
      });

      const result = await settingsService.getGroupDetails('1');

      expect(result).toEqual(expected);
    });
  });

  describe('getUserLogs method', () => {
    const defaultUser = A.user().build();

    const defaultSession = {
      id: 1,
      start_time: new Date().toString(),
      ip_address: '123.123.123.',

      metadata_: {
        session_id: '1',
        human_location: 'New York, NY',
        target_host: 'asdf.com',
      },

      creator: {
        email: 'asdf@asdf.com',
      },
    };

    const defaultExpect = {
      id: '1',
      email: 'asdf@asdf.com',
      location: 'New York, NY',
      host: 'asdf.com',
      ip: '123.123.123.',
    };

    it('should return an ongoing session', async () => {
      const data = {
        user: { ...defaultUser },
        sessions: [{ ...defaultSession }],
      };

      const expected = {
        user: { ...defaultUser },
        logs: [
          {
            ...defaultExpect,
            session: {
              id: '1',
              startTime: expect.any(Date),
            },
          },
        ],
      };

      jest.spyOn(axiosInstance, 'get').mockResolvedValueOnce({
        data: { data },
      });

      const result = await settingsService.getUserLogs('1');

      expect(result).toEqual(expected);
    });

    it('should return a runbook', async () => {
      const data = {
        user: { ...defaultUser },

        sessions: [
          {
            ...defaultSession,
            runbook: {
              id: 1,
              name: 'runbook1',
            },
          },
        ],
      };

      const expected = {
        user: defaultUser,
        logs: [
          {
            ...defaultExpect,
            runbook: {
              id: '1',
              name: 'runbook1',
              date: expect.any(Date),
            },
          },
        ],
      };

      jest.spyOn(axiosInstance, 'get').mockResolvedValueOnce({
        data: { data },
      });

      const result = await settingsService.getUserLogs('1');

      expect(result).toEqual(expected);
    });

    it('should return an approval', async () => {
      const data = {
        user: { ...defaultUser },
        sessions: [
          {
            ...defaultSession,
            approval: {
              id: 1,
              reason: 'reason',
            },
          },
        ],
      };

      const expected = {
        user: defaultUser,
        logs: [
          {
            ...defaultExpect,
            approval: {
              id: '1',
              reason: 'reason',
            },
            session: expect.any(Object),
          },
        ],
      };

      jest.spyOn(axiosInstance, 'get').mockResolvedValueOnce({
        data: { data },
      });

      const result = await settingsService.getUserLogs('1');

      expect(result).toEqual(expected);
    });
  });
});
