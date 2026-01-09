import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useShowToast } from "@/hooks/useToast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types/post";
import type { ColumnDef } from "@tanstack/react-table";
import { EditPostDialog } from "@/components/EditPostDialog";
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
import { MessageCircle } from "lucide-react";
import { CommentList } from "@/components/CommentList";

export default function Profile() {
    const { user, logout, isLoading } = useAuth();
    const toast = useShowToast();
    const navigate = useNavigate();
    const [myPosts, setMyPosts] = useState<Post[]>([]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "posts"), where("authorId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!isLoading && !user) {
            navigate("/login");
        }
    }, [user, isLoading, navigate]);

    const columns: ColumnDef<Post>[] = [
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => <div className="font-medium truncate max-w-50">{row.getValue("title")}</div>,
        },
        {
            accessorKey: "likes",
            header: "Likes",
        },
        {
            accessorKey: "commentsCount",
            header: "Comments",
            cell: ({ row }) => {
                const post = row.original;
                return (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex gap-2">
                                <MessageCircle size={16} />
                                <span>{post.commentsCount || 0}</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-md overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Comments for: {post.title}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <CommentList postId={post.id} />
                            </div>
                        </SheetContent>
                    </Sheet>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <EditPostDialog post={row.original} />

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(row.original.id)}
                    >
                        Delete
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

    if (isLoading || !user) {
        return <div className="flex justify-center mt-20">Redirecting...</div>;
    }

    const handleDelete = async (postId: string) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await deleteDoc(doc(db, "posts", postId));
            toast({ title: "Deleted", description: "Post removed successfully", variant: "success" });
        } catch (error) {
            console.error("Delete post error:", error);
            toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast({ title: "Logout successful", description: "You have successfully logged out.", variant: "success" });
            navigate("/login");
        } catch (err) {
            console.error("Logout error:", err);
            toast({ title: "Logout failed", description: "An error occurred during logout.", variant: "destructive" });
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="max-w-2xl mx-auto p-6 border rounded-xl shadow-sm bg-card flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">Account Info</h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                </div>
                <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </div>
            <div className="border rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">My Posts Analytics</h2>
                </div>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    You haven't posted anything yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-end space-x-2 p-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}