import { IUser } from '@cased/data';

export class UserBuilder {
  _email = 'asdf@asdf.com';
  _name = 'Lorem Ipsum';

  build(): IUser {
    return {
      id: '1',
      email: this._email,
      name: this._name,
    };
  }

  withEmail(email: string) {
    this._email = email;
    return this;
  }

  withName(name: string) {
    this._name = name;
    return this;
  }
}
