import { IRunbookDatabase } from '@cased/data';

export class RunbookDatabaseBuilder {
  private _id = '22';
  private _name = 'My name';
  private _host = 'https://example.com';
  private _port = '3306';
  private _label = 'Custom label';
  private _username = 'asdf@asdf.com';
  private _password = 'mypass';
  private _hasPassword = false;

  build(): IRunbookDatabase {
    const database: IRunbookDatabase = {
      id: this._id,
      name: this._name,
      host: this._host,
      port: this._port,
      label: this._label,
      username: this._username,
      hasPassword: this._hasPassword,
    };

    if (this._password) {
      database.password = this._password;
    }

    return database;
  }

  withId(id: string): RunbookDatabaseBuilder {
    this._id = id;
    return this;
  }

  withName(name: string): RunbookDatabaseBuilder {
    this._name = name;
    return this;
  }

  withHost(host: string): RunbookDatabaseBuilder {
    this._host = host;
    return this;
  }

  withPort(port: string): RunbookDatabaseBuilder {
    this._port = port;
    return this;
  }

  withLabel(label: string): RunbookDatabaseBuilder {
    this._label = label;
    return this;
  }

  withUsername(username: string): RunbookDatabaseBuilder {
    this._username = username;
    return this;
  }

  withPassword(password: string): RunbookDatabaseBuilder {
    this._password = password;
    return this;
  }

  withHasPassword(hasPassword: boolean): RunbookDatabaseBuilder {
    this._hasPassword = hasPassword;
    return this;
  }
}
