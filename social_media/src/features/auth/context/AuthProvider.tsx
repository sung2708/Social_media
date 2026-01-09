import { AuthContext } from "./AuthContext";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import React, { useEffect, useState } from "react";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const register = async (email: string, pass: string) => {
        await createUserWithEmailAndPassword(auth, email, pass);
    }
    const isAuthenticated = !!user; 

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoading, 
            login, 
            logout, 
            register, 
            isAuthenticated
        }}>
            {isLoading ? (
                <div className="flex h-screen items-center justify-center">
                    Loading...
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};