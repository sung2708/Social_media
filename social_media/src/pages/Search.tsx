"use client";

import { useState, useEffect } from "react";
import { TrendingPanel } from "@/components/TrendingPanel";
import { Input } from "@/components/ui/input";
import { Search, Hash, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

type HashtagResult = {
    id: string;
    count?: number;

};

export default function SearchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<HashtagResult[]>([]);
    const [searching, setSearching] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, 500);
    const navigate = useNavigate();

    useEffect(() => {
        const searchHashtags = async () => {
            if (!debouncedSearch.trim()) {
                setResults([]);
                return;
            }

            setSearching(true);
            try {
                const cleanTerm = debouncedSearch.startsWith("#")
                    ? debouncedSearch.slice(1).toLowerCase()
                    : debouncedSearch.toLowerCase();

                const q = query(
                    collection(db, "hashtags"),
                    where("__name__", ">=", cleanTerm),
                    where("__name__", "<=", cleanTerm + "\uf8ff"),
                    limit(10)
                );

                const snap = await getDocs(q);
                setResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setSearching(false);
            }
        };

        searchHashtags();
    }, [debouncedSearch]);

    return (
        <div className="flex flex-col gap-6 py-4 px-2">
            <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search hashtags (e.g., tech...)"
                    className="pl-12 h-12 rounded-full bg-muted/50 border-none focus-visible:ring-1 text-base"
                />
                {searching && (
                    <Loader2 className="absolute right-4 top-3.5 h-5 w-5 animate-spin text-blue-500" />
                )}
            </div>

            {searchTerm.trim() !== "" ? (
                <div className="space-y-2">
                    <h3 className="px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        Search Results
                    </h3>
                    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                        {results.length > 0 ? (
                            results.map((tag) => (
                                <div
                                    key={tag.id}
                                    onClick={() => navigate(`/?tag=${tag.id}`)}
                                    className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-none"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                            <Hash size={18} />
                                        </div>
                                        <span className="font-bold text-foreground">#{tag.id}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{tag.count || 0} posts</span>
                                </div>
                            ))
                        ) : !searching && (
                            <p className="p-8 text-center text-muted-foreground italic">
                                No hashtags were found that match "{searchTerm}"
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <TrendingPanel />
            )}
        </div>
    );
}