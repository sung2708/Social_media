import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import type { Comment } from "@/types/comment";

type ToDateObject = { toDate: () => Date };

function isToDateObject(obj: unknown): obj is ToDateObject {
    return typeof obj === 'object' && obj !== null && typeof (obj as ToDateObject).toDate === 'function';
}

export function CommentList({ postId }: { postId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "posts", postId, "comments"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    text: data.text,
                    userId: data.userId,
                    userEmail: data.userEmail,
                    userAvatar: data.userAvatar,
                    createdAt: data.createdAt,
                } as Comment;
            }));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    if (loading) return <p className="text-center text-sm">Loading comments...</p>;

    return (
        <div className="space-y-4">
            {comments.length > 0 ? (
                comments.map((cmt) => (
                    <div key={cmt.id} className="flex gap-3 items-start border-b pb-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={cmt.userAvatar} />
                            <AvatarFallback><User size={14} /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-sm">{cmt.userEmail}</p>
                                <span className="text-xs text-muted-foreground">
                                    {isToDateObject(cmt.createdAt)
                                        ? cmt.createdAt.toDate().toLocaleString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                        })
                                        : "Just now"}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {cmt.text}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground text-sm">No comments yet.</p>
            )}
        </div>
    );
}