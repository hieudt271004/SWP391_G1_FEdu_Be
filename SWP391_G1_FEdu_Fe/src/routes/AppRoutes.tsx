import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { StudentLayout } from '../components/layout/StudentLayout';
import { TeacherLayout } from '../components/layout/TeacherLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { RoleRoute } from './RoleRoute';

import { HomePage } from '../pages/home/HomePage';
import { AboutPage } from '../pages/about/AboutPage';
import { FeaturesPage } from '../pages/features/FeaturesPage';
import { ContactPage } from '../pages/contact/ContactPage';
import { LoginPage } from '../pages/auth/login/LoginPage';
import { RegisterPage } from '../pages/auth/register/RegisterPage';
import { ForgotPassword } from '../pages/auth/forgot/ForgotPassword';
import { ForgotSuccess } from '../pages/auth/forgot/ForgotSuccess';
import { GoogleAuthPage } from '../pages/auth/google/GoogleAuthPage';
import { ResetPasswordPage } from '../pages/auth/reset/ResetPasswordPage';
import { ResetSuccessPage } from '../pages/auth/reset/ResetSuccessPage';
import { TermsPage } from '../pages/auth/terms/TermsPage';
import { PrivacyPage } from '../pages/auth/privacy/PrivacyPage';


import { DashboardPage } from '../pages/admin/DashboardPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { UserDetailPage } from '../pages/admin/UserDetailPage';
import { SubjectManagementPage } from '../pages/admin/SubjectManagementPage';
import { AddSubjectPage } from '../pages/admin/AddSubjectPage';
import { SubjectDetailPage } from '../pages/admin/SubjectDetailPage';
import { ClassListPage } from '../pages/admin/ClassListPage';
import { ClassDetailPage } from '../pages/admin/ClassDetailPage';
import { ClassroomSubjectDetailPage } from '../pages/admin/ClassroomSubjectDetailPage';
import { AddClassPage } from '../pages/admin/AddClassPage';
import { SlotManagementPage } from '../pages/admin/SlotManagementPage';


import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage';
import { TeacherCoursesPage } from '../pages/teacher/courses/TeacherCoursesPage';
import { CourseClassroomsPage } from '../pages/teacher/courses/CourseClassroomsPage';
import { TeacherClassesPage } from '../pages/teacher/classes/TeacherClassesPage';
import { ClassOverviewPage } from '../pages/teacher/classes/ClassOverviewPage';
import { ClassManagementPage } from '../pages/teacher/classes/ClassManagementPage';
import { TeacherLiveSessionPage } from '../pages/teacher/classes/TeacherLiveSessionPage';
import { StudentDetailsPage } from '../pages/teacher/students/StudentDetailsPage';
import { TeacherTicketsPage } from '../pages/teacher/tickets/TeacherTicketsPage';


import { ProfileEditPage } from '../pages/profile/ProfileEditPage';


import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';
import { StudentCoursesPage } from '../pages/student/StudentCoursesPage';
import { StudentLearningPathPage } from '../pages/student/StudentLearningPathPage';
import { StudentLiveSessionPage } from '../pages/student/StudentLiveSessionPage';
import { NodeTestPage } from '../pages/student/tests/NodeTestPage';
import { PlacementPage } from '../pages/student/tests/PlacementPage';
import { LevelHistoryPage } from '../pages/student/tests/LevelHistoryPage';
import { StudentSubmissionsPage } from '../pages/student/submissions/StudentSubmissionsPage';
import { StudentSchedulePage } from '../pages/student/StudentSchedulePage';






export function AppRoutes() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/contact" element={<ContactPage />} />
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
                <Route path="/student/dashboard" element={<StudentDashboardPage />} />
                <Route path="/student/courses" element={<StudentCoursesPage />} />
                <Route path="/student/classroom-subjects/:csId/learning-path" element={<StudentLearningPathPage />} />
                <Route path="/student/classroom-subjects/:csId/live/:nodeId" element={<StudentLiveSessionPage />} />
                <Route path="/student/tests/:testId" element={<NodeTestPage />} />
                <Route path="/student/classroom-subjects/:csId/placement" element={<PlacementPage />} />
                <Route path="/student/classroom-subjects/:csId/level-history" element={<LevelHistoryPage />} />
                <Route path="/student/submissions" element={<StudentSubmissionsPage />} />
                <Route path="/student/schedule" element={<StudentSchedulePage />} />
                <Route path="/student/profile" element={<ProfileEditPage />} />
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
                <Route path="/teacher/classroom-subjects/:classroomSubjectId" element={<ClassOverviewPage />} />
                <Route path="/teacher/classroom-subjects/:classroomSubjectId/manage" element={<ClassManagementPage />} />
                <Route path="/teacher/classroom-subjects/:classroomSubjectId/live/:nodeId" element={<TeacherLiveSessionPage />} />
                <Route path="/teacher/students/:studentId" element={<StudentDetailsPage />} />
                <Route path="/teacher/tickets" element={<TeacherTicketsPage />} />
                <Route path="/teacher/profile" element={<ProfileEditPage />} />
            </Route>

            {}
            <Route
                element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                        <AdminLayout />
                    </RoleRoute>
                }
            >
                {}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

                {}
                <Route path="/admin/dashboard" element={<DashboardPage />} />

                {}
                <Route path="/admin/slots" element={<SlotManagementPage />} />

                {}
                <Route path="/admin/profile" element={<ProfileEditPage />} />

                {}
                <Route path="/admin/users" element={<UserManagementPage filterRole="all" />} />
                <Route path="/admin/users/students" element={<UserManagementPage filterRole="STUDENT" />} />
                <Route path="/admin/users/teachers" element={<UserManagementPage filterRole="TEACHER" />} />
                <Route path="/admin/users/:id" element={<UserDetailPage />} />

                {}
                <Route path="/admin/subjects" element={<SubjectManagementPage />} />
                <Route path="/admin/subjects/add" element={<AddSubjectPage />} />
                <Route path="/admin/subjects/:id/edit" element={<AddSubjectPage />} />
                <Route path="/admin/subjects/:id" element={<SubjectDetailPage />} />

                {}
                <Route path="/admin/classes" element={<ClassListPage />} />
                <Route path="/admin/classes/add" element={<AddClassPage />} />
                <Route path="/admin/classes/:id/edit" element={<AddClassPage />} />
                <Route path="/admin/classes/:classroomId/subjects/:csId" element={<ClassroomSubjectDetailPage />} />
                <Route path="/admin/classes/:id" element={<ClassDetailPage />} />
            </Route>
            {}

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}