"use client";

import type { CellContext, HeaderContext } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2, Bookmark, Calendar, ChevronRight } from "lucide-react";
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
        const q = query(collection(db, "users", user.uid, "bookmarks"), orderBy("savedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const result = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as BookmarkRow[];
            setData(result);
        });
        return () => unsubscribe();
    }, [user]);

    const removeBookmark = async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "bookmarks", id));
            toast({ title: "Removed", description: "Deleted successfully" });
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to remove", variant: "destructive" });
        }
    };

    const columns = [
        {
            accessorKey: "title",
            header: ({ column }: HeaderContext<BookmarkRow, unknown>) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Post Title <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }: CellContext<BookmarkRow, unknown>) => <div className="font-medium pl-4 max-w-75 truncate">{row.getValue("title")}</div>,
        },
        {
            accessorKey: "savedAt",
            header: "Saved Date",
            cell: ({ row }: CellContext<BookmarkRow, unknown>) => {
                const date = row.original.savedAt?.toDate?.() || new Date();
                return (
                    <div className="flex flex-col text-sm">
                        <span className="font-medium">{date.toLocaleDateString('vi-VN')}</span>
                        <span className="text-xs text-muted-foreground">{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }: CellContext<BookmarkRow, unknown>) => (
                <div className="flex gap-2">
                    <ViewPostDialog postId={row.original.postId} />
                    <Button variant="destructive" size="sm" onClick={() => removeBookmark(row.original.id)}>
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
        initialState: { pagination: { pageSize: 6 } },
    });

    if (isLoading) return <div className="p-10 text-center animate-pulse">Loading bookmarks...</div>;
    if (!user) return <div className="p-10 text-center font-medium">Please login to view bookmarks.</div>;

    return (
        <div className="container mx-auto py-6 md:py-10 px-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 shadow-sm">
                    <Bookmark size={32} />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Bookmarks</h1>
                    <p className="text-sm text-muted-foreground">Manage your saved inspiration.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <div
                            key={row.id}
                            className="group relative bg-card border border-border/60 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all duration-200"
                        >
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg leading-tight line-clamp-2 pr-4 text-foreground">
                                        {row.original.title}
                                    </h3>
                                    <div className="p-1.5 bg-muted rounded-full text-muted-foreground">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar size={14} className="text-blue-500" />
                                    <span>{row.original.savedAt?.toDate?.().toLocaleString('vi-VN')}</span>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <div className="flex-1">
                                        <ViewPostDialog postId={row.original.postId} />
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="rounded-xl px-4"
                                        onClick={() => removeBookmark(row.original.id)}
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-3xl text-muted-foreground bg-muted/20">
                        No bookmarks found.
                    </div>
                )}
            </div>
            <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="py-4 px-6 font-bold text-xs uppercase text-muted-foreground">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/20 transition-colors border-border/50">
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
                                    No bookmarks found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-border/40">
                <div className="text-sm font-medium text-muted-foreground order-2 sm:order-1 bg-muted/50 px-4 py-1.5 rounded-full">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
                    <Button
                        variant="outline"
                        className="flex-1 sm:flex-none rounded-xl h-10 font-semibold"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 sm:flex-none rounded-xl h-10 font-semibold shadow-sm"
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