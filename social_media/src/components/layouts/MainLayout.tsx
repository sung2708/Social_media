import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { SidebarNav } from "./SideBar";
import { TrendingPanel } from "@/components/TrendingPanel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Search, Bookmark, User } from "lucide-react";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { useNavigate } from "react-router-dom";


export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const hideSidePanelRoutes = ["/profile", "/bookmarks","/search"];
    const shouldHideSidePanel = hideSidePanelRoutes.includes(location.pathname);

    return (
        <div className="relative min-h-screen flex flex-col bg-background">
            <Navbar />

            <div className="flex-1 container mx-auto flex gap-6 px-4 md:px-6 lg:px-8 mt-16 pb-20 md:pb-0">
                <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-20 shrink-0 p-2 md:block lg:w-64">
                    <div className="h-full border-r border-border/50 pr-4">
                        <SidebarNav />
                    </div>
                </aside>
                <main className="flex-1 py-4 md:py-8 overflow-y-auto min-w-0">
                    <div className={cn(
                        "mx-auto",
                        shouldHideSidePanel ? "max-w-4xl" : "max-w-2xl"
                    )}>
                        <Outlet />
                    </div>
                </main>
                {!shouldHideSidePanel && (
                    <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-80 shrink-0 py-8 xl:block">
                        <TrendingPanel />
                    </aside>
                )}
            </div>
            <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/50 p-3 flex justify-around items-center z-50 md:hidden">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <Home className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/search")}>
                    <Search className="h-6 w-6" />
                </Button>
                <CreatePostModal isIconButton />
                <Button variant="ghost" size="icon" onClick={() => navigate("/bookmarks")}>
                    <Bookmark className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                    <User className="h-6 w-6" />
                </Button>
            </nav>
        </div>
    );
}