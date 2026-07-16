export type ClassroomStatus = 'inactive' | 'active' | 'completed';
export type Term = string;

interface StatusMeta {
  label: string;
  /** Class Tailwind cho <Badge>, hỗ trợ dark mode đồng bộ toàn hệ thống. */
  badgeClass: string;
}

export const CLASSROOM_STATUS_META: Record<ClassroomStatus, StatusMeta> = {
  active: {
    label: 'Đang hoạt động',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent',
  },
  inactive: {
    label: 'Chưa bắt đầu',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent',
  },
  completed: {
    label: 'Đã hoàn thành',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent',
  },
};

/** Luôn trả về meta hợp lệ; giá trị lạ/thiếu coi như "Chưa bắt đầu". */
export function getClassroomStatusMeta(status?: string | null): StatusMeta {
  return CLASSROOM_STATUS_META[(status as ClassroomStatus)] ?? CLASSROOM_STATUS_META.inactive;
}

export const TERM_LABELS: Record<string, string> = {
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall',
};

export const TERM_OPTIONS: { value: Term; label: string }[] = [
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'FALL', label: 'Fall' },
];

/**
 * Nhãn "Kì học" hiển thị, ví dụ "Fall 2024".
 * Ưu tiên `semesterLabel` do backend dựng sẵn; nếu không có thì ghép từ term + năm.
 */
export function formatSemester(
  term?: string | null,
  academicYear?: number | null,
  semesterLabel?: string | null,
): string {
  if (semesterLabel) return semesterLabel;
  const t = term ? (TERM_LABELS[term as Term] ?? term) : '';
  const label = [t, academicYear ?? ''].filter(Boolean).join(' ').trim();
  return label || '—';
}
