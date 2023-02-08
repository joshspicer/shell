import type { IApiProvider } from '@cased/data';

export class ApiProviderBuilder {
  private _hasToken = false;
  private _hasPassword = false;
  private _id = '1';
  private _name = 'name';
  private _baseUrl?: string;
  private _authType: 'basic' | 'token' = 'basic';
  private _username?: string;
  private _password?: string;
  private _authToken?: string;
  private _secretToken?: string;

  build(): IApiProvider {
    const result: IApiProvider = {
      id: this._id,
      name: this._name,
      baseUrl: this._baseUrl,
      authType: this._authType,
      username: this._username,
      authToken: this._authToken,
      hasPassword: this._hasPassword,
      hasToken: this._hasToken,
    };

    if (this._password) {
      result.password = this._password;
    }

    if (this._secretToken) {
      result.secretToken = this._secretToken;
    }

    return result;
  }

  withId(id: string): ApiProviderBuilder {
    this._id = id;
    return this;
  }

  withName(name: string): ApiProviderBuilder {
    this._name = name;
    return this;
  }

  withBaseUrl(baseUrl: string): ApiProviderBuilder {
    this._baseUrl = baseUrl;
    return this;
  }

  withAuthType(authType: 'basic' | 'token'): ApiProviderBuilder {
    this._authType = authType;
    return this;
  }

  withUsername(username: string): ApiProviderBuilder {
    this._username = username;
    return this;
  }

  withPassword(password: string): ApiProviderBuilder {
    this._password = password;
    return this;
  }

  withAuthToken(authToken: string): ApiProviderBuilder {
    this._authToken = authToken;
    return this;
  }

  withSecretToken(secretToken: string): ApiProviderBuilder {
    this._secretToken = secretToken;
    return this;
  }

  withHasPassword(hasPassword: boolean) {
    this._hasPassword = hasPassword;
    return this;
  }

  withHasToken(hasToken: boolean) {
    this._hasToken = hasToken;
    return this;
  }
}
