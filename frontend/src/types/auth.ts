export type UserRole = "user" | "super_admin" | "veterinarian";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone: string;
};

export type AuthState = {
  token: string;
  user: AuthUser;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  code?: number;
  data?: T;
};
