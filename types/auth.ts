// Authentication and User Management Types

export interface User {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: {
    id: string;
    name: string;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

export interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export interface LogoutButtonProps {
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}
