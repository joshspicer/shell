import { AxiosError } from 'axios';

export const errorToAxiosError = (error: unknown) =>
  error as AxiosError<{ reason: string; status: string }>;
