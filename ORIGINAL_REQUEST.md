# Original User Request

## Initial Request — 2026-07-02T15:03:32+07:00

Redesign the Teacher Dashboard page to offer a premium, modern, and highly intuitive user experience for educators. The redesign will improve the layout, typography, and card presentation while preserving all existing backend data integrations.

Working directory: /Users/mac/Documents/GitHub/SWP391_G1_FEdu_Be/SWP391_G1_FEdu_Fe
Integrity mode: development

## Requirements

### R1. Visual Overhaul and Premium Aesthetics
- Update the layout of `TeacherDashboardPage.tsx` using a modern design system.
- Utilize polished typography (using the pre-configured `Outfit` font), well-spaced cards with subtle shadows or borders (using the css variables defined in `theme.css`), and micro-interactions/transitions.
- Implement clear visual hierarchies: the welcome hero banner should feel premium and engaging, the metric cards should highlight key statistics effectively, and the active classes list should present information cleanly.

### R2. Layout Responsiveness
- Ensure that the dashboard layout is fully responsive, looking exceptional and functioning flawlessly on mobile, tablet, and desktop screens.
- Use CSS grid/flexbox patterns to reflow sections smoothly without overflow or overlapping text.

### R3. Preserving Functional Integration
- Keep all original API calls, state hooks, and react-router navigations intact.
- The numbers of subjects, classes, and unique students must continue to load correctly from the backend APIs via `teacherService` and `classroomService`.
- All quick action buttons and course/class routing paths must remain fully functional.

## Acceptance Criteria

### Visual Design & Aesthetics
- [ ] No generic/default browser styles; uses the project's Outfit font and theme colors (`theme.css` tokens).
- [ ] Welcome banner, metric cards, and classroom lists are visually balanced with consistent margins and padding.
- [ ] Cards have hover effects (e.g., transition, translate, subtle border/shadow change) that feel responsive and high-end.

### Functional Integrity & Responsiveness
- [ ] Zero build/lint errors in the frontend build command (`npm run build`).
- [ ] The dashboard loads successfully with actual data when integrated with the backend.
- [ ] No layout breakage (no overflow, horizontal scrollbars, or text collisions) down to 360px viewport width.
- [ ] Clicking on "Vào lớp học" (Enter Class), "Quản lý môn học" (Manage Subjects), etc. navigates to the correct routes.

## Follow-up — 2026-07-02T10:05:25Z

Fix the admin user information update issue on the `/admin/users` screen by relaxing phone number validation in the backend and updating the editing modal on the frontend to support all fields including gender and date of birth.

Working directory: /Users/mac/Documents/GitHub/SWP391_G1_FEdu_Be
Integrity mode: development

## Requirements

### R1. Backend Phone Number Validation Relaxation
- Update `PhoneValidator.java` to allow `null`, empty, blank, or `"—"` strings as valid phone numbers (treated as optional). Only validate format if a non-blank value is entered.

### R2. Frontend Modal Enhancements (`UserDetailModal.tsx`)
- **Add Fields**: Include **Giới tính** (Gender) and **Ngày sinh** (Date of birth) input fields in the editing modal.
- **Initial Values Mapping**:
  - Convert date of birth from `"dd/MM/yyyy"` format (returned by the backend) to `"yyyy-MM-dd"` format (required for the HTML `<input type="date" />`).
  - Clear the placeholder `"—"` from the phone number state so the input field shows as empty instead of displaying `"—"`.
- **Form Submission Mapping**:
  - Map the local date format (`yyyy-MM-dd`) back to `"dd/MM/yyyy"` for the backend update payload.
  - Map selected gender (`"Male" | "Female" | "Other"`) to backend enum values (`"MALE" | "FEMALE" | "OTHER"`).

### R3. Compile & Sync
- Ensure the backend compiles cleanly without errors.
- Ensure the frontend builds cleanly without TypeScript or bundler errors (`npm run build`).

## Acceptance Criteria

### Visual Layout & Form Inputs
- [ ] The `UserDetailModal` displays dropdown/select options for "Giới tính" (Nam, Nữ, Khác) and a date picker for "Ngày sinh".
- [ ] If a user has no phone number, the input field is displayed as empty (not showing `"—"`).

### Functional Integrity
- [ ] Submitting the updated information successfully calls `adminService.updateUser` and refreshes the user list.
- [ ] Saving updates for a user with no phone number or a blank phone number succeeds without triggering a `"Phone number invalid format"` error.
- [ ] The application compiles cleanly on both frontend (`npm run build`) and backend.

## Follow-up — 2026-07-02T10:06:59Z

In `UserDetailModal.tsx` (both Add and Edit modes), the 'Avatar URL' text input must be replaced with a file upload button/control. Clicking it should open the native file dialog, validate the image format (PNG, JPEG, JPG, WEBP) and size (max 5MB), display a loading spinner / 'Đang tải...' state when uploading, and upload directly to Cloudinary using `uploadService.uploadToCloudinary` to set `formData.avatarUrl` upon success.

## Follow-up — 2026-07-02T10:07:46Z

Redesign the User Management Page (`UserManagementPage.tsx`) and the User Detail Modal (`UserDetailModal.tsx`) to offer a premium, modern, and highly polished user experience.
Standardize on the Outfit font, use the cohesive theme variables from `theme.css` instead of raw inline styles, and add hover and active transition micro-animations. Ensure visual elements (buttons, cards, table rows, inputs) have cohesive spacing, smooth transitions, and interactive hover effects to match the premium dashboard aesthetic.
