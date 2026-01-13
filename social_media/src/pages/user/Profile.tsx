import { useEffect, useState, useRef } from "react"; // Thêm useRef để xử lý logout race condition
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useShowToast } from "@/hooks/useToast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types/post";
import type { ColumnDef } from "@tanstack/react-table";
import { EditPostDialog } from "@/components/EditPostDialog";
import { AlertModal } from "@/components/modals/AlertModal";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
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
import { MessageCircle, Trash2, LayoutDashboard, UserCircle, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { CommentList } from "@/components/CommentList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Profile() {
    const { user, logout, isLoading } = useAuth();
    const toast = useShowToast();
    const navigate = useNavigate();
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const isLoggingOut = useRef(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "posts"), where("authorId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!isLoading && !user && !isLoggingOut.current) {
            navigate("/login");
        }
    }, [user, isLoading, navigate]);

    const confirmDelete = async (postId: string) => {
        try {
            setIsDeleting(true);
            await deleteDoc(doc(db, "posts", postId));
            toast({ title: "Deleted", description: "Post removed successfully", variant: "success" });
            setPostToDelete(null);
        } catch (error) {
            console.error("Delete error:", error);
            toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = async () => {
        try {
            isLoggingOut.current = true;
            await logout();
            toast({ title: "Logout successful", variant: "success" });
            navigate("/");
        } catch (err) {
            console.error("Logout error:", err);
            isLoggingOut.current = false;
            toast({ title: "Logout failed", variant: "destructive" });
        }
    };

    const columns: ColumnDef<Post>[] = [
        {
            accessorKey: "title",
            header: "Post Content",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 max-w-75">
                    <span className="font-bold text-foreground truncate">{row.original.title || "Untitled"}</span>
                    <span className="text-xs text-muted-foreground truncate line-clamp-1">{row.original.content}</span>
                </div>
            ),
        },
        {
            accessorKey: "likes",
            header: "Engagement",
            cell: ({ row }) => (
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-red-500">
                        <span className="font-medium">{row.original.likes || 0}</span>
                        <span className="text-[10px] uppercase font-bold">Likes</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-500">
                        <span className="font-medium">{row.original.commentsCount || 0}</span>
                        <span className="text-[10px] uppercase font-bold">Comments</span>
                    </div>
                </div>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right">Management</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                                <MessageCircle size={14} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-md">
                            <SheetHeader>
                                <SheetTitle>Comments Analytics</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <CommentList postId={row.original.id} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <EditPostDialog post={row.original} />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setPostToDelete(row.original.id)}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data: myPosts,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 5 } },
    });

    if (isLoading || (!user && !isLoggingOut.current)) {
        return <div className="flex justify-center mt-20 text-muted-foreground animate-pulse">Loading workspace...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex items-center justify-between p-6 border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/10">
                            <AvatarImage src={user?.photoURL || ""} />
                            <AvatarFallback><UserCircle size={32} /></AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-foreground">
                                {user?.displayName || user?.email?.split('@')[0]}
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium">{user?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive gap-2">
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>

                <div className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Posts</p>
                    <p className="text-4xl font-black text-primary">{myPosts.length}</p>
                </div>
            </div>

            <div className="border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/50 flex items-center gap-2">
                    <LayoutDashboard size={18} className="text-primary" />
                    <h2 className="text-lg font-bold tracking-tight">Content Analytics</h2>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="text-xs uppercase font-bold text-muted-foreground py-4">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground italic">
                                        No content published yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/10">
                    <p className="text-xs text-muted-foreground font-medium">
                        Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
            <AlertModal
                open={!!postToDelete}
                isLoading={isDeleting}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) setPostToDelete(null);
                }}
                title="Confirm Deletion"
                description="Are you sure you want to delete this post? This action cannot be undone."
                onConfirm={() => {
                    if (postToDelete) confirmDelete(postToDelete);
                }}
            />
        </div>
    );
}