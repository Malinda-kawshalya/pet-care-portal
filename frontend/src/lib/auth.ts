import { apiRequest } from "@/lib/api";
import type { AuthState, AuthUser, UserRole } from "@/types/auth";

type AuthPayload = {
  token: string;
  user: AuthUser;
};

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}): Promise<AuthState> {
  const response = await apiRequest<AuthPayload>("/auth/register", {
    method: "POST",
    body: input,
  });

  if (!response.data) {
    throw new Error("Invalid registration response");
  }

  return response.data;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthState> {
  const response = await apiRequest<AuthPayload>("/auth/login", {
    method: "POST",
    body: input,
  });

  if (!response.data) {
    throw new Error("Invalid login response");
  }

  return response.data;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const response = await apiRequest<Record<string, never>>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });

  return response.message || "Password reset link requested";
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
}): Promise<string> {
  const response = await apiRequest<Record<string, never>>("/auth/reset-password", {
    method: "POST",
    body: input,
  });

  return response.message || "Password reset successful";
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<{ user: AuthUser }>("/auth/me", {
    method: "GET",
    auth: true,
  });

  if (!response.data?.user) {
    throw new Error("No user found");
  }

  return response.data.user;
}

export async function logoutUser(): Promise<void> {
  await apiRequest<Record<string, never>>("/auth/logout", {
    method: "POST",
    auth: true,
  });
}

export function canAccessRole(
  role: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(role);
}
