import { http } from './http';

export const subMentorService = {
  
  getMentees: () => http.get<unknown[]>('/support/mentees'),
  getDashboard: () => http.get<unknown>('/support/dashboard'),
  
};