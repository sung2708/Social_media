"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // Thêm useNavigate
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { PostCard } from "@/components/posts/PostCard";
import type { Post } from "@/types/post";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function HomePage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tagFilter = searchParams.get("tag");

    useEffect(() => {
        const postsRef = collection(db, "posts");
        let q;

        if (tagFilter) {
            q = query(
                postsRef,
                where("hashtags", "array-contains", tagFilter.toLowerCase()),
                orderBy("createdAt", "desc")
            );
        } else {
            q = query(postsRef, orderBy("createdAt", "desc"));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPosts(postData as Post[]);
            setLoading(false);
        }, (error) => {
            console.error("Firestore error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tagFilter]);

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <div className="mb-8">
                <CreatePostModal />
            </div>
            {tagFilter && (
                <div className="max-w-lg w-full mb-6 flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                    <p className="text-blue-500 font-medium flex-1">
                        Showing posts with: <span className="text-blue-700 font-black">#{tagFilter}</span>
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-blue-500/20 text-blue-600 rounded-full"
                        onClick={() => navigate("/")}
                    >
                        <X size={16} className="mr-1" /> Clear
                    </Button>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 w-full bg-muted animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.length > 0 ? (
                        posts.map((post) => <PostCard key={post.id} post={post} />)
                    ) : (
                        <div className="text-center py-20 border border-dashed rounded-2xl">
                            <p className="text-muted-foreground">No posts found with #{tagFilter}</p>
                        </div>
                    )}
                </div>
            )}
            <ScrollToTopButton />
        </div>
    );
}