import { http } from './http';
import type { UserStatus } from '../types/user';


export interface AdminUserResponse {
  userId: number;      
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status: string;      
  gender?: string;     
  bod?: string;
  phone?: string;
  isDeleted?: boolean;
  roles: string[];     
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
  userRole: string; 
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  gender?: string;
  bod?: string; 
  avatarUrl?: string;
  status?: UserStatus;
  userRole?: string;
}

export const adminService = {
  
  getAllUsers: () => http.get<AdminUserResponse[]>('/admin/users'),

  
  getUserById: (userId: number) =>
    http.get<AdminUserResponse>(`/admin/users/${userId}`),

  
  createUser: (req: CreateUserRequest) =>
    http.post<void>('/admin/add', req),

  
  deleteUser: (email: string) =>
    http.delete<void>('/admin/delete', email),

  
  updateUserStatus: (userName: string, status: UserStatus) =>
    http.patch<void>('/admin/status', { userName, status }),

  
  updateUser: (userId: number, req: UpdateUserRequest) =>
    http.put<void>(`/admin/users/${userId}`, req),
};
