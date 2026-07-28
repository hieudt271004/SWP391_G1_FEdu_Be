export interface SemesterResponse {
  semesterId: number;
  term: string;
  academicYear: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  semesterLabel: string;
}

export interface SemesterRequest {
  term: string;
  academicYear: number;
  startDate: string;
  endDate: string;
}
