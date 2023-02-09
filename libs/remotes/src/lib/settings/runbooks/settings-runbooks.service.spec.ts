import { IApiProvider } from '@cased/data';
import { axiosInstance } from '../../axios';
import { settingsRunbooksService } from './settings-runbooks.service';

describe('SettingsRunbooksService', () => {
  describe('getDatabase method', () => {
    it('should return a database object', async () => {
      const data = {
        database: {
          name: 'asdf',
          host: 'asdf',
          port: 'asdf',
          label: 'asdf',
          username: 'asdf',
        },
        pw: false,
      };

      jest
        .spyOn(axiosInstance, 'get')
        .mockResolvedValue(Promise.resolve({ data }));

      const actual = await settingsRunbooksService.getDatabase('1');

      expect(actual).toEqual({
        id: '1',
        name: 'asdf',
        host: 'asdf',
        port: 'asdf',
        label: 'asdf',
        username: 'asdf',
        hasPassword: false,
      });
    });

    it('should return empty strings for missing response fields', async () => {
      const data = {
        database: {},
        pw: false,
      };

      jest
        .spyOn(axiosInstance, 'get')
        .mockResolvedValue(Promise.resolve({ data }));

      const actual = await settingsRunbooksService.getDatabase('1');

      expect(actual).toEqual({
        id: '1',
        name: '',
        host: '',
        port: '',
        label: '',
        username: '',
        hasPassword: false,
      });
    });
  });

  describe('getApiProvider method', () => {
    it('should return an api provider object', async () => {
      const data = {
        api_provider: {
          api_name: 'asdf',
          base_url: 'asdf',
          authentication_type: 'basic',
          data: {
            username: 'asdf',
            password: 'asdf',
            auth_token: 'asdf',
            secret_token: 'asdf',
          },
        },
        pw: true,
      };

      jest
        .spyOn(axiosInstance, 'get')
        .mockResolvedValue(Promise.resolve({ data }));

      const actual = await settingsRunbooksService.getApiProvider('1');

      expect(actual).toEqual({
        id: '1',
        name: 'asdf',
        baseUrl: 'asdf',
        authType: 'basic',
        username: 'asdf',
        authToken: 'asdf',
        hasPassword: true,
        hasToken: false,
      });
    });
  });

  describe('setApiProvider method', () => {
    it('should call axiosInstance.put with the correct object', async () => {
      const id = '1';
      const apiProvider: IApiProvider = {
        id,
        name: 'asdf',
        baseUrl: 'asdf',
        authType: 'basic',
        username: 'asdf',
        password: 'asdf',
        authToken: 'asdf',
        secretToken: 'asdf',
      };

      jest.spyOn(axiosInstance, 'patch').mockResolvedValue(Promise.resolve({}));
      await settingsRunbooksService.setApiProvider(id, apiProvider);

      expect(axiosInstance.patch).toHaveBeenCalledWith(
        `/api/api_providers/${id}`,
        {
          api_name: 'asdf',
          base_url: 'asdf',
          authentication_type: 'basic',
          username: 'asdf',
          password: 'asdf',
          auth_token: 'asdf',
          secret_token: 'asdf',
        },
      );
    });
  });
});
