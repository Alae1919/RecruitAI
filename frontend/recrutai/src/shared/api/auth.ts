import { request, apiClient } from '../http/client';

export interface AuthUser {
  id: number;
  email: string;
  role: 'RECRUITER' | 'JOBSEEKER';
  first_name?: string;
  last_name?: string;
}

interface AuthTokens {
  access: string;
  refresh: string;
  user: AuthUser;
}

export const registerRecruiter = (data: Record<string, unknown>) =>
  request({ method: 'POST', url: '/users/register/recruiter/', data });

export const registerJobSeeker = (data: FormData) =>
  request({
    method: 'POST',
    url: '/users/register/jobseeker/',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const loginUser = (data: { email: string; password: string }) =>
  request<AuthTokens>({ method: 'POST', url: '/users/login/', data });

export const fetchCurrentUser = () =>
  request<AuthUser>({ method: 'GET', url: '/users/me/' });

export const logoutUser = async (): Promise<void> => {
  const token = localStorage.getItem('refreshToken');
  if (token) {
    try {
      await request({ method: 'POST', url: '/users/logout/', data: { refresh: token } });
    } catch {
      // blacklist call failed — still clear local tokens
    }
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const refreshToken = (refresh: string) =>
  apiClient
    .post<Pick<AuthTokens, 'access' | 'refresh'>>('/users/token/refresh/', { refresh })
    .then(r => r.data);
