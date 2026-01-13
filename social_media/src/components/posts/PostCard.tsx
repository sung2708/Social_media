import { useState, useEffect } from "react";
import {
    Heart, MessageCircle, User, Send, CheckCircle2,
    Bookmark
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { useShowToast } from "@/hooks/useToast";
import type { Post } from "@/types/post";
import type { Comment } from "@/types/comment";
import {
    doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc,
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot,
    setDoc, deleteDoc
} from "firebase/firestore";


export function PostCard({ post }: { post: Post }) {
    const { user } = useAuth();
    const toast = useShowToast();
    const [likesCount, setLikesCount] = useState(post.likes || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const isLiked = user?.uid ? post.likedBy?.includes(user.uid) : false;

    useEffect(() => {
        if (!showComments) return;
        const q = query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
        });
        return () => unsubscribe();
    }, [showComments, post.id]);

    useEffect(() => {
        const checkBookmarkStatus = async () => {
            if (!user) return;
            const bookmarkRef = doc(db, "users", user.uid, "bookmarks", post.id);
            const docSnap = await getDoc(bookmarkRef);
            if (docSnap.exists()) {
                setIsBookmarked(true);
            }
        };
        checkBookmarkStatus();
    }, [user, post.id]);

    const handleBookmark = async () => {
        if (!user) {
            toast({
                title: "Login required",
                description: "You need to log in to bookmark posts!",
                variant: "destructive"
            });
            return;
        }
        const bookmarkRef = doc(db, "users", user.uid, "bookmarks", post.id);

        try {
            if (isBookmarked) {
                await deleteDoc(bookmarkRef);
                setIsBookmarked(false);
                toast({ title: "Unbookmarked", description: "Removed from your bookmarks." });
            } else {
                await setDoc(bookmarkRef, {
                    postId: post.id,
                    title: post.title,
                    imageUrl: post.imageUrl || "",
                    savedAt: serverTimestamp(),
                });
                setIsBookmarked(true);
                toast({ title: "Bookmarked", description: "Added to your bookmarks." });
            }
        } catch (error) {
            console.error("Bookmark error:", error);
            toast({ title: "Error", description: "Unable to perform this action.", variant: "destructive" });
        }
    }

    const handleLike = async () => {
        if (!user) {
            toast({ title: "Login required", description: "You need to log in to like posts!", variant: "destructive" });
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
            console.error("Error updating likes:", error);
            setLikesCount(post.likes || 0);
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;
        try {
            const commentData = {
                text: commentText,
                userId: user.uid,
                userName: user.displayName || "User",
                userAvatar: user.photoURL || "",
                createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, "posts", post.id, "comments"), commentData);
            await updateDoc(doc(db, "posts", post.id), { commentsCount: increment(1) });
            setCommentText("");
        } catch (error) { console.error(error); }
    };
    return (
        <Card className="max-w-lg w-full border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:bg-card mb-6 overflow-hidden">

            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 transition-transform hover:scale-105">
                        <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} className="object-cover" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {post.authorName?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="font-semibold text-foreground hover:underline cursor-pointer">{post.authorName}</span>
                            <CheckCircle2 className="w-3 h-3 text-white fill-blue-500" strokeWidth={3} />
                        </div>
                        <span className="text-xs text-muted-foreground leading-none mt-1">
                            @{post.authorName?.toLowerCase().replace(/\s+/g, '')} · {
                                post.createdAt
                                    ? (typeof post.createdAt.toDate === 'function'
                                        ? post.createdAt.toDate()
                                        : new Date(
                                            typeof post.createdAt === 'string' || typeof post.createdAt === 'number'
                                                ? post.createdAt
                                                : ""
                                        )
                                    ).toLocaleString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : "Now"
                            }
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                {post.title && <h3 className="font-bold text-lg mb-1 text-foreground">{post.title}</h3>}
                <p className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap">{post.content}</p>

                {post.imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border/50">
                        <img
                            src={post.imageUrl}
                            alt="Post content"
                            className="h-auto w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border/50 pt-3 px-4 pb-4">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2 transition-colors rounded-full", isLiked ? "text-red-500 hover:text-red-400 hover:bg-red-500/10" : "text-muted-foreground hover:text-foreground")}
                        onClick={handleLike}
                    >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                        <span className="text-sm font-medium">{likesCount}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{post.commentsCount || 0}</span>
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("gap-2 transition-colors rounded-full", isBookmarked ? "text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10" : "text-muted-foreground hover:text-foreground")}
                    onClick={handleBookmark}
                >
                    <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                </Button>
            </CardFooter>
            {showComments && (
                <div className="bg-muted/30 border-t border-border/50 p-4 space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {comments.map((cmt) => (
                            <div key={cmt.id} className="flex gap-2 items-start">
                                <Avatar className="h-7 w-7 mt-0.5 shadow-sm">
                                    <AvatarImage src={cmt.userAvatar} />
                                    <AvatarFallback><User size={12} /></AvatarFallback>
                                </Avatar>
                                <div className="bg-background dark:bg-zinc-900 px-3 py-2 rounded-2xl flex-1 border border-border/50">
                                    <p className="font-bold text-[12px] text-blue-600">@{cmt.userName.replace(/\s+/g, '').toLowerCase()}</p>
                                    <p className="text-sm text-foreground leading-snug">{cmt.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {user ? (
                        <form onSubmit={handleSendComment} className="flex gap-2 items-center">
                            <Input
                                placeholder="Write comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="flex-1 rounded-full bg-background border-border/50 h-9 text-sm focus-visible:ring-1"
                            />
                            <Button type="submit" size="icon" disabled={!commentText.trim()} className="rounded-full h-8 w-8 shrink-0">
                                <Send size={14} />
                            </Button>
                        </form>
                    ) : (
                        <p className="text-center text-[11px] text-muted-foreground italic">Log in to comment.</p>
                    )}
                </div>
            )}
        </Card>
    );
}
