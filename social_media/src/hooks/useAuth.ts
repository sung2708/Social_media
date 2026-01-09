import { useContext } from "react";
import { AuthContext } from "@/features/auth/context/AuthContext";
import type { AuthContextType } from "@/types/auth";

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === null || context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context as AuthContextType;
}

