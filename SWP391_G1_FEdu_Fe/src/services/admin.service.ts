import { http } from './http';
import type { UserStatus } from '../types/user';

// Type khớp chính xác với JSON BE trả về (field name từ Java UserResponse)
export interface AdminUserResponse {
  userId: number;      // BE: Long userId
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status: string;      // "ACTIVE" | "INACTIVE" | "NONE"
  gender?: string;     // "MALE" | "FEMALE" | "OTHER"
  bod?: string;
  phone?: string;
  isDeleted?: boolean;
  roles: string[];     // ["ADMIN"] | ["TEACHER"] | ["STUDENT"] ...
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  userRole: string; // "ADMIN" | "TEACHER" | "STUDENT" | "SUB_MENTOR" | "USER"
}

export const adminService = {
  // GET /admin/users
  getAllUsers: () => http.get<AdminUserResponse[]>('/admin/users'),

  // GET /admin/users/:id
  getUserById: (userId: number) =>
    http.get<AdminUserResponse>(`/admin/users/${userId}`),

  // POST /admin/add
  createUser: (req: CreateUserRequest) =>
    http.post<void>('/admin/add', req),

  // DELETE /admin/delete — body là email string
  deleteUser: (email: string) =>
    http.delete<void>('/admin/delete', email),

  // PATCH /admin/status
  updateUserStatus: (userName: string, status: UserStatus) =>
    http.patch<void>('/admin/status', { userName, status }),
};
