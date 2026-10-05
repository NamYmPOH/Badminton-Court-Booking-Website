export type UserRole = "CUSTOMER" | "STAFF" | "OWNER" | "ADMIN";
export type UserStatus = "ACTIVE" | "BLOCKED";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  loyaltyPoints: number;
  image: string | null;
}

export interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  email?: string;
}

export interface LoginInput {
  identifier: string; // phone or email
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
}
