import type { User } from "firebase/auth";

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    register: (email: string, pass: string) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated?: boolean;
}