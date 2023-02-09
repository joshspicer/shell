export interface IUser {
  id?: string;
  email?: string;
  name?: string;
  groups?: string[];
  role?: 'admin' | 'user';
}
