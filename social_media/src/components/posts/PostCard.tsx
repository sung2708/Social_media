import { useState, useEffect } from "react";
import { Heart, MessageCircle, User, Send } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { Post } from "@/types/post";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import type { Comment } from "@/types/comment";

import {
    doc, updateDoc, increment, arrayUnion, arrayRemove,
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useShowToast } from "@/hooks/useToast";


type ToDateObject = { toDate: () => Date };

function isToDateObject(obj: unknown): obj is ToDateObject {
    return typeof obj === 'object' && obj !== null && typeof (obj as ToDateObject).toDate === 'function';
}

export function PostCard({ post }: { post: Post }) {
    const { user } = useAuth();
    const [likesCount, setLikesCount] = useState(post.likes || 0);

    const isLiked = user?.uid ? post.likedBy?.includes(user.uid) : false;

    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const toast = useShowToast();

    useEffect(() => {
        if (!showComments) return;

        const q = query(
            collection(db, "posts", post.id, "comments"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
        });

        return () => unsubscribe();
    }, [showComments, post.id]);

    const handleLike = async () => {
        if (!user) {
            toast({
                title: "Login Required",
                description: "You need to log in to like posts!",
                variant: "destructive",
            });
            return;
        }

        const postRef = doc(db, "posts", post.id);
        const newLikedState = !isLiked;

        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

        try {
            await updateDoc(postRef, {
                likes: increment(newLikedState ? 1 : -1),
                likedBy: newLikedState ? arrayUnion(user.uid) : arrayRemove(user.uid)
            });
        } catch (error) {
            setLikesCount(post.likes || 0);
            console.error("Like error:", error);
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;

        try {
            const commentData = {
                text: commentText,
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || "User",
                userAvatar: user.photoURL || "",
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "posts", post.id, "comments"), commentData);
            await updateDoc(doc(db, "posts", post.id), {
                commentsCount: increment(1)
            });

            setCommentText("");
        } catch (error) {
            console.error("Comment error:", error);
        }
    };

    return (
        <Card className="w-full mb-6 overflow-hidden border-none shadow-md bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center gap-3 p-4">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={post.authorAvatarUrl} />
                    <AvatarFallback><User size={18} /></AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">{post.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                        {isToDateObject(post.createdAt)
                            ? post.createdAt.toDate().toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            })
                            : "Just now"}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="px-4 pb-2">
                    <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                </div>
                {post.imageUrl && (
                    <div className="mt-2 bg-muted flex items-center justify-center overflow-hidden">
                        <img
                            src={post.imageUrl}
                            alt="Post content"
                            className="w-full h-auto max-h-125 object-contain"
                        />
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col border-t mt-2 p-0">
                <div className="flex justify-between w-full p-2 px-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={cn("flex gap-2 transition-colors", isLiked && "text-red-500 hover:text-red-600")}
                    >
                        <Heart size={18} className={cn(isLiked && "fill-current")} />
                        <span>{likesCount}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex gap-2"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageCircle size={18} />
                        <span>{post.commentsCount || 0}</span>
                    </Button>
                </div>

                {showComments && (
                    <div className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-t space-y-4">
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {comments.map((cmt) => (
                                <div key={cmt.id} className="flex gap-2 text-sm items-start">
                                    <Avatar className="h-6 w-6 mt-1">
                                        <AvatarImage src={cmt.userAvatar} />
                                        <AvatarFallback><User size={12} /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white dark:bg-slate-800 p-2 px-3 rounded-2xl shadow-sm flex-1">
                                        <p className="font-bold text-[11px] text-blue-600">{cmt.userName}</p>
                                        <p className="leading-tight text-foreground">{cmt.text}</p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-center text-xs text-muted-foreground py-2">No comments yet. Be the first!</p>
                            )}
                        </div>
                        {user ? (
                            <form onSubmit={handleSendComment} className="flex gap-2 items-center">
                                <Input
                                    placeholder="Write a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="flex-1 rounded-full bg-background h-9 text-sm"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!commentText.trim()}
                                    className="rounded-full h-9 w-9"
                                >
                                    <Send size={14} />
                                </Button>
                            </form>
                        ) : (
                            <p className="text-[11px] text-center text-muted-foreground italic">Login to comment on this post.</p>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}