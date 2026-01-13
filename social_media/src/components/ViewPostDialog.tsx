"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore"; // Sử dụng onSnapshot để cập nhật Realtime
import { db } from "@/lib/firebase";
import { PostCard } from "@/components/posts/PostCard";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import type { Post } from "@/types/post";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // Để ẩn Title cho đúng chuẩn Accessibility

export function ViewPostDialog({ postId }: { postId: string }) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let unsubscribe: () => void;

        if (open && postId) {
            setLoading(true);
            const docRef = doc(db, "posts", postId);
            
            unsubscribe = onSnapshot(docRef, 
                (docSnap) => {
                    if (docSnap.exists()) {
                        setPost({ id: docSnap.id, ...docSnap.data() } as Post);
                    } else {
                        setPost(null);
                    }
                    setLoading(false);
                }, 
                (error) => {
                    console.error("Error fetching post:", error);
                    setLoading(false);
                }
            );
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [open, postId]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:bg-secondary">
                    <ExternalLink size={14} className="mr-2" /> View
                </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-lg p-0 bg-transparent border-none shadow-none sm:max-w-xl">
                <VisuallyHidden>
                    <DialogTitle>View Post Detail</DialogTitle>
                </VisuallyHidden>

                {loading ? (
                    <div className="flex justify-center p-20 bg-card/50 backdrop-blur-md rounded-3xl border border-border/50">
                        <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                    </div>
                ) : post ? (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <PostCard post={post} />
                    </div>
                ) : (
                    <div className="p-10 bg-card rounded-2xl text-center border border-border/50 shadow-xl">
                        <p className="text-muted-foreground">Post not found or has been deleted.</p>
                        <Button 
                            variant="link" 
                            onClick={() => setOpen(false)}
                            className="mt-2 text-blue-500"
                        >
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}