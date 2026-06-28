export const LEVEL_MAP: Record<number, string> = {
  1: 'Yếu',
  2: 'Trung bình',
  3: 'Khá',
};

export function getLevelLabel(level?: number | string | null): string {
  if (level === undefined || level === null) return 'N/A';
  const num = typeof level === 'string' ? parseInt(level, 10) : level;
  return LEVEL_MAP[num] || `Mức ${num}`;
}
