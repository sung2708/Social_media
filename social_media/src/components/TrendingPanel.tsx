"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";

interface TrendingTopic {
    id: string;
    count: number;
}

export function TrendingPanel() {
    const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(
            collection(db, "hashtags"),
            orderBy("count", "desc"),
            limit(5)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const topics = snapshot.docs.map((doc) => ({
                id: doc.id,
                count: doc.data().count || 0,
            }));
            setTrendingTopics(topics);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching trending:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm sticky top-20">
            <CardHeader className="pb-3 border-b border-border/50 mb-2">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Trending Now
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-2">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-muted rounded-md w-full" />
                        ))}
                    </div>
                ) : trendingTopics.length > 0 ? (
                    trendingTopics.map((topic, index) => (
                        <div
                            key={topic.id}
                            className="group cursor-pointer transition-all hover:bg-secondary/50 -mx-2 px-4 py-2 rounded-none"
                            onClick={() => navigate(`/?tag=${topic.id}`)}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    {index + 1} · Trending
                                </span>
                            </div>
                            <p className="font-bold text-[15px] text-foreground group-hover:text-blue-500 transition-colors">
                                #{topic.id}
                            </p>
                            <span className="text-[12px] text-muted-foreground">
                                {topic.count.toLocaleString()} posts
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No trending topics yet.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}