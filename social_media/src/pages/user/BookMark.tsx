"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { useShowToast } from "@/hooks/useToast";
import type { BookmarkRow } from "@/types/bookmark";
import { ViewPostDialog } from "@/components/ViewPostDialog";


export default function BookmarksPage() {
    const { user, isLoading } = useAuth();
    const toast = useShowToast();
    const [data, setData] = useState<BookmarkRow[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "bookmarks"),
            orderBy("savedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const result = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as BookmarkRow[];
            setData(result);
        });

        return () => unsubscribe();
    }, [user]);

    const removeBookmark = async (postId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "bookmarks", postId));
            toast({ title: "Removed", description: "Bookmark deleted successfully" });
        } catch (error) {
            console.error("Error removing bookmark:", error);
            toast({ title: "Error", description: "Failed to remove bookmark.", variant: "destructive" });
        }
    };

    const columns = [
        {
            accessorKey: "title",
            header: ({ column }: import("@tanstack/react-table").HeaderContext<BookmarkRow, unknown>) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Post Title <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }: import("@tanstack/react-table").CellContext<BookmarkRow, unknown>) => <div className="font-medium pl-4">{row.getValue("title")}</div>,
        },
        {
            accessorKey: "savedAt",
            header: "Saved Date",
            cell: ({ row }: import("@tanstack/react-table").CellContext<BookmarkRow, unknown>) => {
                const rawSavedAt = row.original.savedAt;
                const date = rawSavedAt?.toDate ? rawSavedAt.toDate() : (rawSavedAt ? new Date() : null);

                return (
                    <div className="text-sm">
                        {date ? (
                            <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                    {date.toLocaleDateString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {date.toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic">Just now</span>
                        )}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }: import("@tanstack/react-table").CellContext<BookmarkRow, unknown>) => (
                <div className="flex gap-2">
                    <ViewPostDialog postId={row.original.postId} />
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeBookmark(row.original.id)}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageSize: 5 } },
    });

    if (isLoading) return <div className="p-10 text-center">Loading bookmarks...</div>;
    if (!user) return <div className="p-10 text-center">Please login to view bookmarks.</div>;

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">My Bookmarks</h1>
                <p className="text-muted-foreground">Manage and track your saved inspiration.</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
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
                                    No bookmarks found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex items-center justify-between p-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}