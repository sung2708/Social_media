"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useShowToast } from "@/hooks/useToast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types/post";
import { EditPostDialog } from "@/components/EditPostDialog";
import { AlertModal } from "@/components/modals/AlertModal";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getPaginationRowModel,
    type SortingState,
    type ColumnDef
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { MessageCircle, Trash2, LayoutDashboard, LogOut, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { CommentList } from "@/components/CommentList";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Timestamp } from "firebase/firestore";

export default function Profile() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const [data, setData] = useState<Post[]>([]);
    const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const isLoggingOut = useRef(false);

    const toast = useShowToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, "posts"),
            where("authorId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setData(result);
        }, (error) => {
            console.error("Firestore error:", error);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    useEffect(() => {
        if (!authLoading && !user && !isLoggingOut.current) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    const confirmDelete = async (postId: string) => {
        try {
            setIsDeleting(true);
            await deleteDoc(doc(db, "posts", postId));
            toast({ title: "Deleted", description: "Post removed successfully" });
            setPostToDelete(null);
        } catch (error) {
            console.error("Delete post error:", error);
            toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = async () => {
        try {
            isLoggingOut.current = true;
            await logout();
            navigate("/");
            toast({ title: "Logged out" });
        } catch (err) {
            console.error("Logout error:", err);
            toast({ title: "Error", description: "Failed to log out", variant: "destructive" });
            isLoggingOut.current = false;
        }
    };

    const columns = useMemo<ColumnDef<Post>[]>(() => [
        {
            accessorKey: "title",
            header: "Content",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 min-w-37.5 max-w-75">
                    <span className="font-bold text-foreground truncate">{row.original.title || "No Title"}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{row.original.content}</span>
                </div>
            ),
        },
        {
            accessorKey: "likes",
            header: "Stats",
            cell: ({ row }) => (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                    <div className="flex items-center gap-1 text-red-500">
                        <span className="font-bold">{row.original.likes || 0}</span>
                        <span className="text-[10px] uppercase font-bold hidden sm:inline">Likes</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-500">
                        <span className="font-bold">{row.original.commentsCount || 0}</span>
                        <span className="text-[10px] uppercase font-bold hidden sm:inline">Comments</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "createdAt",
            header: "Published",
            cell: ({ row }) => {
                const date = (row.getValue("createdAt") as Timestamp)?.toDate?.();
                return (
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {date ? date.toLocaleDateString('vi-VN') : "---"}
                    </div>
                )
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right">Manage</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1 sm:gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-500/10 hover:text-blue-500">
                                <MessageCircle size={14} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md">
                            <SheetHeader>
                                <SheetTitle>Comments Analytics</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 h-full overflow-y-auto pb-20">
                                <CommentList postId={row.original.id} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <EditPostDialog post={row.original} />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setPostToDelete(row.original.id)}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            ),
        },
    ], []);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageSize: 6 }
        }
    });

    if (authLoading) {
        return <div className="flex justify-center mt-20 text-muted-foreground animate-pulse font-medium">Loading Workspace...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2 flex items-center justify-between p-6 border border-border/50 bg-card/50 backdrop-blur-md rounded-3xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                                {user?.email?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground truncate">
                                {user?.displayName || user?.email?.split('@')[0]}
                            </h1>
                            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive gap-2 rounded-full">
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>

                <div className="p-6 border border-border/50 bg-primary/5 rounded-3xl shadow-sm flex flex-col justify-center items-center md:items-start">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <BarChart3 size={14} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Total Content</p>
                    </div>
                    <p className="text-4xl font-black text-foreground">{data.length}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:hidden p-4">
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <div
                            key={row.id}
                            className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform"
                        >
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-lg leading-tight line-clamp-1">
                                        {row.original.title || "No Title"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                        {row.original.content}
                                    </p>
                                </div>
                                <div className="flex gap-4 py-2 border-y border-border/40">
                                    <div className="flex items-center gap-1.5 text-red-500">
                                        <span className="text-sm font-bold">{row.original.likes || 0}</span>
                                        <span className="text-[10px] uppercase font-black">Likes</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-blue-500">
                                        <span className="text-sm font-bold">{row.original.commentsCount || 0}</span>
                                        <span className="text-[10px] uppercase font-black">Comments</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="secondary" className="flex-1 rounded-xl h-10 gap-2">
                                                <MessageCircle size={16} /> Comments
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="h-[80vh] rounded-t-[32px]">
                                            <SheetHeader>
                                                <SheetTitle>Comments Analytics</SheetTitle>
                                            </SheetHeader>
                                            <div className="mt-4 overflow-y-auto pb-10">
                                                <CommentList postId={row.original.id} />
                                            </div>
                                        </SheetContent>
                                    </Sheet>

                                    <EditPostDialog post={row.original} />

                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl"
                                        onClick={() => setPostToDelete(row.original.id)}
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-2xl">
                        No posts found.
                    </div>
                )}
            </div>
            <div className="hidden md:block">
            <div className="border border-border/50 bg-card/50 backdrop-blur-md rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/50 flex items-center gap-2">
                    <LayoutDashboard size={18} className="text-primary" />
                    <h2 className="text-lg font-bold tracking-tight">Post Management</h2>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="text-[10px] uppercase font-black text-muted-foreground py-4 px-6">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} className="border-border/50 hover:bg-muted/10 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-4 px-6">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground italic">
                                        No posts found in your workspace.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                        Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>
            </div>

            <AlertModal
                open={!!postToDelete}
                isLoading={isDeleting}
                onOpenChange={(open) => { if (!open && !isDeleting) setPostToDelete(null); }}
                title="Delete Post?"
                description="This will permanently remove your content and all associated comments."
                onConfirm={() => { if (postToDelete) confirmDelete(postToDelete); }}
            />
        </div>
    );
}