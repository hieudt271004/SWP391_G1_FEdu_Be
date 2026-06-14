export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUB_MENTOR' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'NONE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface User {
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    roles: UserRole[];
    status: UserStatus;
    gender?: Gender;
    bod?: string;
    phone?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
}

export type AuthMeResponse = User;