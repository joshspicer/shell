import { IUser } from '@cased/data';
import { axiosInstance } from '../axios';

const get = async (id: string): Promise<IUser> => {
  const {
    data: {
      user: { name, email },
      user_groups: groups,
    },
  } = await axiosInstance.get<{
    user: {
      name: string;
      email: string;
    };
    user_groups: {
      name: string;
    }[];
  }>(`/api/users/${id}`);

  return {
    name,
    email,
    groups: groups.map(({ name: groupName }) => groupName),
  };
};

const create = async (email: string, password: string): Promise<void> => {
  await axiosInstance.post('/api/users', {
    email,
    password,
  });
};

export const usersService = {
  get,
  create,
};
