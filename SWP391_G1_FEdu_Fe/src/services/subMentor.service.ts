import { http } from './http';

export const subMentorService = {
  /** Danh sách mentee đang hỗ trợ */
  getMentees: () => http.get<unknown[]>('/support/mentees'),
  getDashboard: () => http.get<unknown>('/support/dashboard'),
  // TODO: reviewSubmission, getMenteeProgress, ...
};