// Authentication and User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'researcher' | 'participant' | 'admin';
  avatar?: string | undefined;
  emailVerified?: boolean | undefined;
  createdAt: Date;
  updatedAt: Date;
  organization?: string | undefined;
  twoFactorEnabled?: boolean | undefined;
}

export interface Session {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role?: 'researcher' | 'participant';
  organization?: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerification {
  token: string;
}

export interface SocialProvider {
  id: 'google' | 'microsoft' | 'orcid' | 'github' | 'apple';
  name: string;
  icon?: React.ComponentType;
}

export interface AuthContextValue {
  // State
  user: User | null;
  session: Session;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;

  // Methods
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithProvider: (provider: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: PasswordReset) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}
