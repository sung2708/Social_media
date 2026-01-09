import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import { Toaster } from "@/components/ui/sonner"

import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}