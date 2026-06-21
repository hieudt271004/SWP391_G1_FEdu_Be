import { http } from './http';
import type { Subject } from '../types/subject';
import type { ClassroomResponse } from '../types/classroom';
import type { StudentInClass } from '../types/student';
import type { ClassroomSubjectResponse } from '../types/classroomSubject';

export const teacherService = {
  getSubjectsByTeacher: (teacherId: number) =>
    http.get<Subject[]>(`/teacher/subjects/${teacherId}`),
  getClassroomsByTeacher: (teacherId: number) =>
    http.get<ClassroomSubjectResponse[]>(`/teacher/classrooms/${teacherId}`),
  getClassroomById: (classroomId: number) =>
    http.get<ClassroomResponse>(`/classrooms/${classroomId}`),
  getClassroomSubjectById: (classroomSubjectId: number) =>
    http.get<ClassroomSubjectResponse>(`/teacher/classroom-subjects/${classroomSubjectId}`),
  getStudentsInClassroom: (classroomId: number) =>
    http.get<StudentInClass[]>(`/classrooms/${classroomId}/students`),
  getClassroomsBySubject: (subjectId: number) =>
    http.get<ClassroomResponse[]>(`/classrooms/subject/${subjectId}`),
  getSubjectById: (subjectId: number) =>
    http.get<Subject>(`/subjects/${subjectId}`),
  cancelStudentPlacement: (csId: number, studentId: number) =>
    http.post<void>(`/teacher-manage/classroom-subjects/${csId}/students/${studentId}/placement/cancel`),
};