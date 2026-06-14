export type Screen =
  | "login"
  | "register"
  | "forgot"
  | "forgot-success"
  | "google"
  | "terms"
  | "privacy"
  | "reset-password"
  | "reset-success";

export type RegField = "first" | "last" | "email" | "pw" | "confirm";

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterFormData = {
  first: string;
  last: string;
  email: string;
  pw: string;
  confirm: string;
  terms: boolean;
};

export const defaultRegisterForm: RegisterFormData = {
  first: "",
  last: "",
  email: "",
  pw: "",
  confirm: "",
  terms: false,
};