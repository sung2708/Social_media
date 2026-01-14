"use client"

import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, User, Bookmark, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Bookmark, label: "Bookmarks", path: "/bookmarks" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Search, label: "Search", path: "/search" },
]

export function SidebarNav() {
    return (
        <nav className="flex flex-col gap-1 w-full">
            {navItems.map((item) => (
                <NavLink
                    key={item.label}
                    to={item.path}
                    className={({ isActive }) =>
                        cn(
                            "group flex items-center py-1 outline-none transition-all",
                            isActive ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full",
                        )
                    }
                >
                    {({ isActive }) => (
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-4 px-4 py-6 text-xl rounded-full transition-all group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10",
                                isActive ? "font-bold" : "font-normal"
                            )}
                        >
                            <item.icon
                                size={28}
                                className={cn(
                                    "transition-transform group-hover:scale-110",
                                    isActive && "fill-gray-900 dark:fill-white"
                                )}
                            />
                            <span className="hidden lg:inline-block">{item.label}</span>
                        </Button>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}