import { http } from './http';
import type { Subject, SubjectRequest } from '../types/subject';

export const subjectService = {
  getAll: () => http.get<Subject[]>('/subjects'),

  getById: (id: number) => http.get<Subject>(`/subjects/${id}`),

  create: (req: SubjectRequest) => http.post<Subject>('/subjects', req),

  update: (id: number, req: SubjectRequest) =>
    http.put<Subject>(`/subjects/${id}`, req),

  delete: (id: number) => http.delete<void>(`/subjects/${id}`),
};
