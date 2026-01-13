import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PostCard } from "@/components/posts/PostCard";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import type { Post } from "@/types/post";

export function ViewPostDialog({ postId }: { postId: string }) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open && postId) {
            const fetchPost = async () => {
                setLoading(true);
                try {
                    const docRef = doc(db, "posts", postId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setPost({ id: docSnap.id, ...docSnap.data() } as Post);
                    }
                } catch (error) {
                    console.error("Error fetching post:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [open, postId]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <ExternalLink size={14} className="mr-1" /> View
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-0 bg-transparent border-none shadow-none">
                {loading ? (
                    <div className="flex justify-center p-10 bg-background rounded-xl">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : post ? (
                    <PostCard post={post} />
                ) : (
                    <div className="p-10 bg-background rounded-xl text-center">
                        Post not found or has been deleted.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}