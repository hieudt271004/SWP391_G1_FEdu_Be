import { http } from './http';
import { SemesterResponse, SemesterRequest } from '../types/semester';

export const semesterService = {
  getAll: () => http.get<SemesterResponse[]>('/admin/semesters'),
  create: (data: SemesterRequest) => http.post<SemesterResponse>('/admin/semesters', data),
  update: (id: number, data: SemesterRequest) => http.put<SemesterResponse>(`/admin/semesters/${id}`, data),
  delete: (id: number) => http.delete<void>(`/admin/semesters/${id}`),
};
