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
