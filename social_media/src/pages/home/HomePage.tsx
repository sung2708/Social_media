"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { PostCard } from "@/components/posts/PostCard";
import type { Post } from "@/types/post";
import ScrollToTopButton from "@/components/ScrollToTopButton";

export default function HomePage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPosts(postData as Post[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <CreatePostModal />
            </div>

            {loading ? (
                <p>Loading new post...</p>
            ) : (
                <div className="space-y-4">
                    {posts.length > 0 ? (
                        posts.map((post) => <PostCard key={post.id} post={post} />)
                    ) : (
                        <p className="text-center text-muted-foreground">No posts available.</p>
                    )}
                </div>
            )}
            <ScrollToTopButton />
        </div>
    );
}