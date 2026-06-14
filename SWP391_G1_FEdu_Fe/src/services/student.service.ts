import { http } from './http';

export const studentService = {
  getDashboard: () => http.get<unknown>('/student/dashboard'),
  getMyClassrooms: () => http.get<unknown[]>('/student/classrooms'),
  // TODO: getMilestoneById, submitMilestone, getProfile, updateProfile, ...
};