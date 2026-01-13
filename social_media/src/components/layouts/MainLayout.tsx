import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { SidebarNav } from "./SideBar";

export default function MainLayout() {
    return (
        <div className="relative min-h-screen flex flex-col bg-background">
            <Navbar />

            <div className="flex-1 container mx-auto flex gap-6 px-4 md:px-6 lg:px-8 mt-16">
                <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-20 shrink-0 p-2 md:block lg:w-64">
                    <div className="h-full border-r border-border/50 pr-4">
                        <SidebarNav />
                    </div>
                </aside>

                <main className="flex-1 py-8 overflow-y-auto">
                    <div className="max-w-4xl"> 
                        <Outlet />
                    </div>
                </main>

            </div>

            <footer className="border-t bg-muted/40 z-10">
                <div className="container mx-auto px-4 py-10 md:py-12">
                    <div className="text-center text-sm text-muted-foreground">
                        © 2026 Social Media. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}