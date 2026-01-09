import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function MainLayout() {
    return (
        <div className="relative min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8 mt-16">
                <div className="max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>

            <footer className="border-t bg-muted/40">
                <div className="container mx-auto px-4 py-10 md:py-12">
                    <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                        © 2026 Social Media. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}