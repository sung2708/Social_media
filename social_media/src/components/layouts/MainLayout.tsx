import { Outlet, useLocation } from "react-router-dom"; // Thêm useLocation
import Navbar from "./Navbar";
import { SidebarNav } from "./SideBar";
import { TrendingPanel } from "@/components/TrendingPanel";
import { cn } from "@/lib/utils";

export default function MainLayout() {
    const location = useLocation();
    const hideSidePanelRoutes = ["/profile", "/bookmarks"];
    const shouldHideSidePanel = hideSidePanelRoutes.includes(location.pathname);

    return (
        <div className="relative min-h-screen flex flex-col bg-background">
            <Navbar />

            <div className="flex-1 container mx-auto flex gap-6 px-4 md:px-6 lg:px-8 mt-16">
                <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-20 shrink-0 p-2 md:block lg:w-64">
                    <div className="h-full border-r border-border/50 pr-4">
                        <SidebarNav />
                    </div>
                </aside>
                <main className="flex-1 py-8 overflow-y-auto min-w-0">
                    <div className={cn(
                        "mx-auto transition-all duration-300",
                        shouldHideSidePanel ? "max-w-4xl" : "max-w-2xl lg:ml-0 xl:mx-auto"
                    )}>
                        <Outlet />
                    </div>
                </main>
                {!shouldHideSidePanel && (
                    <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-80 shrink-0 py-8 xl:block">
                        <div className="space-y-6">
                            <TrendingPanel />
                        </div>
                    </aside>
                )}
            </div>

            <footer className={cn(
                "border-t bg-muted/40 z-10",
                !shouldHideSidePanel && "xl:hidden"
            )}>
                <div className="container mx-auto px-4 py-10">
                    <div className="text-center text-sm text-muted-foreground">
                        © 2026 Social Media. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}