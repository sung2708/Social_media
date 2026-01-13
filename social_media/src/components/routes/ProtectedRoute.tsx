import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/routes/path";
import React from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    
    const { user, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }
    if (!user) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) return null;
    if (user) return <Navigate to={ROUTES.HOME} replace />;

    return <>{children}</>;
};