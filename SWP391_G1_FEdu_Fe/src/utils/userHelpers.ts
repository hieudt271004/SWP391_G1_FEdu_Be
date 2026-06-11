import { User } from '../types/user';

export function getFullName(user: User | null): string {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

export function getInitials(user: User | null): string {
  if (!user) return '?';
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
}

export function formatGender(gender?: string): string {
  if (!gender) return 'Not specified';
  const genderMap: Record<string, string> = {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
  };
  return genderMap[gender] || gender;
}

export function formatDateOfBirth(bod?: string): string {
  if (!bod) return 'Not specified';
  return bod;
}
