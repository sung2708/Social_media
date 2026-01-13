import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import HomePage from "@/pages/home/HomePage";
import Profile from "@/pages/user/Profile";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import NotFound from "@/pages/NotFound";
import BookmarksPage from "@/pages/user/BookMark";
import { ROUTES } from "./path";
import { ProtectedRoute, AuthRoute } from "@/components/routes/ProtectedRoute";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: ROUTES.PROFILE.slice(1),
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                ),
            },
            {
                path: ROUTES.BOOKMARKS,
                element: (
                    <ProtectedRoute>
                        <BookmarksPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: "*",
                element: <NotFound />,
            },
        ],
    },
    {
        path: ROUTES.LOGIN,
        element: (
            <AuthRoute>
                <Login />
            </AuthRoute>
        ),
    },
    {
        path: ROUTES.REGISTER,
        element: (
            <AuthRoute>
                <Register />
            </AuthRoute>
        ),
    },
    {
        path: ROUTES.PROFILE,
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
    },
]);