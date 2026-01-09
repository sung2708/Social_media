import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { Moon, Sun, Menu, LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur shadow-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    Social Media
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                </nav>

                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-9 w-9 border">
                                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                                        <AvatarFallback className="bg-primary/10">
                                            {user.email?.charAt(0).toUpperCase() || <UserIcon size={16} />}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/profile" className="cursor-pointer w-full">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild variant="default" size="sm">
                            <Link to="/login">Login</Link>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}