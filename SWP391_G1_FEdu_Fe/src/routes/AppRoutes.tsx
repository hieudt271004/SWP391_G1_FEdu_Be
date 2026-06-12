import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { StudentLayout } from '../components/layout/StudentLayout';
import { TeacherLayout } from '../components/layout/TeacherLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { SubMentorLayout } from '../components/layout/SubMentorLayout';
import { RoleRoute } from './RoleRoute';

import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/auth/login/LoginPage';
import { RegisterPage } from '../pages/auth/register/RegisterPage';
import { ForgotPassword } from '../pages/auth/forgot/ForgotPassword';
import { ForgotSuccess } from '../pages/auth/forgot/ForgotSuccess';
import { GoogleAuthPage } from '../pages/auth/google/GoogleAuthPage';
import { ResetPasswordPage } from '../pages/auth/reset/ResetPasswordPage';
import { ResetSuccessPage } from '../pages/auth/reset/ResetSuccessPage';
import { TermsPage } from '../pages/auth/terms/TermsPage';
import { PrivacyPage } from '../pages/auth/privacy/PrivacyPage';

// Admin pages
import { DashboardPage } from '../pages/admin/DashboardPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { UserDetailPage } from '../pages/admin/UserDetailPage';
import { CourseManagementPage } from '../pages/admin/CourseManagementPage';
import { AddCoursePage } from '../pages/admin/AddCoursePage';
import { CourseDetailPage } from '../pages/admin/CourseDetailPage';
import { ClassListPage } from '../pages/admin/ClassListPage';
import { ClassDetailPage } from '../pages/admin/ClassDetailPage';
import { AddClassPage } from '../pages/admin/AddClassPage';

// Teacher pages
import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage';
import { TeacherCoursesPage } from '../pages/teacher/courses/TeacherCoursesPage';
import { CourseClassroomsPage } from '../pages/teacher/courses/CourseClassroomsPage';
import { TeacherClassesPage } from '../pages/teacher/classes/TeacherClassesPage';
import { ClassOverviewPage } from '../pages/teacher/classes/ClassOverviewPage';
import { ClassManagementPage } from '../pages/teacher/classes/ClassManagementPage';
import { StudentDetailsPage } from '../pages/teacher/students/StudentDetailsPage';

// Common pages
import { ProfileEditPage } from '../pages/profile/ProfileEditPage';


// Removed UserDetailPageWrapper, using UserDetailPage directly

// ──────────────────────────────────────────────────────────────────────────

export function AppRoutes() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
            </Route>

            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/forgot-success" element={<ForgotSuccess />} />
                <Route path="/google-login" element={<GoogleAuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/reset-success" element={<ResetSuccessPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
            </Route>

            <Route
                element={
                    <RoleRoute allowedRoles={['STUDENT']}>
                        <StudentLayout />
                    </RoleRoute>
                }
            >
                <Route path="/student/dashboard" element={<div>Student Dashboard placeholder</div>} />
            </Route>

            <Route
                element={
                    <RoleRoute allowedRoles={['TEACHER']}>
                        <TeacherLayout />
                    </RoleRoute>
                }
            >
                <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
                <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
                <Route path="/teacher/courses" element={<TeacherCoursesPage />} />
                <Route path="/teacher/courses/:subjectId" element={<CourseClassroomsPage />} />
                <Route path="/teacher/classes" element={<TeacherClassesPage />} />
                <Route path="/teacher/classrooms/:classroomId" element={<ClassOverviewPage />} />
                <Route path="/teacher/classrooms/:classroomId/manage" element={<ClassManagementPage />} />
                <Route path="/teacher/students/:studentId" element={<StudentDetailsPage />} />
                <Route path="/teacher/profile" element={<ProfileEditPage />} />
            </Route>

            <Route
                element={
                    <RoleRoute allowedRoles={['SUB_MENTOR']}>
                        <SubMentorLayout />
                    </RoleRoute>
                }
            >
                <Route path="/sub-mentor/dashboard" element={<div>Sub-Mentor Dashboard placeholder</div>} />
            </Route>

            {/* ── ADMIN ─────────────────────────────────────────────── */}
            <Route
                element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                        <AdminLayout />
                    </RoleRoute>
                }
            >
                {/* Redirect /admin → /admin/dashboard */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

                {/* Dashboard */}
                <Route path="/admin/dashboard" element={<DashboardPage />} />

                {/* User management */}
                <Route path="/admin/users" element={<UserManagementPage filterRole="all" />} />
                <Route path="/admin/users/students" element={<UserManagementPage filterRole="STUDENT" />} />
                <Route path="/admin/users/teachers" element={<UserManagementPage filterRole="TEACHER" />} />
                <Route path="/admin/users/:id" element={<UserDetailPage onBack={() => window.history.back()} />} />

                {/* Course management */}
                <Route path="/admin/courses" element={<CourseManagementPage />} />
                <Route path="/admin/courses/add" element={<AddCoursePage />} />
                <Route path="/admin/courses/:id/edit" element={<AddCoursePage />} />
                <Route path="/admin/courses/:id" element={<CourseDetailPage />} />

                {/* Class management */}
                <Route path="/admin/classes" element={<ClassListPage />} />
                <Route path="/admin/classes/add" element={<AddClassPage />} />
                <Route path="/admin/classes/:id/edit" element={<AddClassPage />} />
                <Route path="/admin/classes/:id" element={<ClassDetailPage />} />
            </Route>
            {/* ─────────────────────────────────────────────────────── */}

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}