
export const LEVEL_LABELS: Record<number, string> = {
  1: 'Yếu',
  2: 'Trung bình',
  3: 'Khá',
};

export function levelLabel(level: number | null | undefined): string {
  if (level == null) return '—';
  return LEVEL_LABELS[level] ?? `Mức ${level}`;
}
