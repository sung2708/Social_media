import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useShowToast } from "@/hooks/useToast";
import { postSchema } from "@/schema/post";
import type { PostFormValues } from "@/schema/post";
import { Image as ImageIcon, User, X, Hash } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import {
    writeBatch, doc, collection, increment,
    serverTimestamp, query, where, getDocs, limit
} from "firebase/firestore";
import { useDebounce } from "@/hooks/useDebounce";
import imageCompression from 'browser-image-compression';
import { tr } from "zod/v4/locales";
import heic2any from "heic2any";

export function CreatePostModal() {
    const [open, setOpen] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const toast = useShowToast();

    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState("");
    const debouncedTag = useDebounce(currentTag, 400);

    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CLOUD_UPLOAD_PRESET;

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: { title: "", content: "", imageUrl: "" },
    });

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>, onChange: (val: string) => void) => {
        const value = e.target.value;
        onChange(value);

        const words = value.split(/\s/);
        const lastWord = words[words.length - 1] || "";

        if (lastWord.startsWith("#") && lastWord.length > 1) {
            setCurrentTag(lastWord.slice(1).toLowerCase());
        } else {
            setCurrentTag("");
            setSuggestions([]);
        }
    };

    useEffect(() => {
        if (!debouncedTag) {
            setSuggestions([]);
            return;
        }
        const fetchTags = async () => {
            try {
                const q = query(
                    collection(db, "hashtags"),
                    where("__name__", ">=", debouncedTag),
                    where("__name__", "<=", debouncedTag + "\uf8ff"),
                    limit(5)
                );
                const snap = await getDocs(q);
                setSuggestions(snap.docs.map(d => d.id));
            } catch (error) {
                console.error("Error fetching tags:", error);
            }
        };
        fetchTags();
    }, [debouncedTag]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);

        try {
            let fileToProcess = file;
            if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.8,
                });

                fileToProcess = new File(
                    [Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob],
                    file.name.replace(/\.[^/.]+$/, ".jpg"),
                    { type: "image/jpeg" }
                );
            }

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1080,
                useWebWorker: true,
                initialQuality: 0.7
            };
            const compressedFile = await imageCompression(fileToProcess, options);
            const preview = URL.createObjectURL(compressedFile);
            setPreviewUrl(preview);

        } catch (error) {
            console.error("Error", error);
            toast({
                title: "Image Error",
                description: "Cannot process this image. Please try a different one.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const clearSelectedFile = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const extractHashtags = (text: string) => {
        const hashtags = text.match(/#(\w+)/g);
        if (!hashtags) return [];
        return Array.from(new Set(hashtags.map(tag => tag.slice(1).toLowerCase())));
    };

    const onSubmit = async (data: PostFormValues) => {
        if (!isAuthenticated || !user) return;
        setUploading(true);

        try {
            let finalImageUrl = data.imageUrl;
            const file = fileInputRef.current?.files?.[0];

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", UPLOAD_PRESET);

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                    { method: "POST", body: formData }
                );

                if (!response.ok) throw new Error("Upload to Cloudinary failed");
                const cloudinaryData = await response.json();
                finalImageUrl = cloudinaryData.secure_url;
            }

            const batch = writeBatch(db);
            const hashtags = extractHashtags(data.content);
            const postRef = doc(collection(db, "posts"));

            batch.set(postRef, {
                title: data.title,
                content: data.content,
                imageUrl: finalImageUrl,
                hashtags: hashtags,
                authorId: user.uid,
                authorName: user.displayName || user.email?.split('@')[0] || "User",
                authorAvatarUrl: user.photoURL || "",
                likes: 0,
                likedBy: [],
                commentsCount: 0,
                createdAt: serverTimestamp(),
            });

            hashtags.forEach((tag) => {
                const tagRef = doc(db, "hashtags", tag);
                batch.set(tagRef, {
                    name: tag,
                    count: increment(1),
                    lastUsed: serverTimestamp(),
                }, { merge: true });
            });

            await batch.commit();

            toast({ title: "Success", description: "Post published!", variant: "success" });
            setOpen(false);
            setPreviewUrl(null);
            form.reset();
            setSuggestions([]);
        } catch (error) {
            console.error("Submit error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to create post." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) { setSuggestions([]); setCurrentTag(""); }
        }}>
            <DialogTrigger asChild>
                {user ? (
                    <Card className="max-w-lg w-full cursor-pointer border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:bg-card mb-6 overflow-hidden">
                        <CardHeader className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10 border-2 border-primary/20 transition-transform hover:scale-105">
                                    <AvatarImage src={user.photoURL || ""} alt={user.email || "User"} className="object-cover" />
                                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                                        {user.email?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center h-10 px-4 w-full bg-muted/50 border border-border/50 rounded-full hover:bg-muted transition-all text-muted-foreground text-sm">
                                        Hey {user.email?.split('@')[0]}, what's on your mind?
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ) : (
                    <Link to="/login" className="max-w-lg w-full block mb-6">
                        <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card transition-all">
                            <CardHeader className="py-4 px-6">
                                <CardTitle className="text-muted-foreground font-normal text-lg">Create a new post</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">Login to share your thoughts</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                )}
            </DialogTrigger>

            <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 p-0 overflow-hidden shadow-2xl sm:max-w-[600px]">
                <DialogHeader className="p-4 border-b border-border/50">
                    <DialogTitle>Create new post</DialogTitle>
                    <DialogDescription className="hidden">Post creation form with hashtag support</DialogDescription>
                </DialogHeader>

                <div className="flex gap-4 p-4">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={user?.photoURL || ""} className="object-cover" />
                        <AvatarFallback><User size={20} /></AvatarFallback>
                    </Avatar>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-3">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder="Title (optional)"
                                                className="border-none text-lg font-bold px-2 py-2 focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem className="relative">
                                        <FormControl>
                                            <Textarea
                                                rows={4}
                                                placeholder="What's on your mind? Use # to add tags"
                                                className="border-none text-base resize-none px-2 py-2 focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                                                {...field}
                                                onChange={(e) => handleContentChange(e, field.onChange)}
                                            />
                                        </FormControl>

                                        {suggestions.length > 0 && (
                                            <div className="absolute left-0 bottom-full mb-2 w-56 bg-card border border-border/50 rounded-xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                                                <div className="p-2 border-b border-border/50 bg-muted/30 flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                    <Hash size={10} /> Suggested Tags
                                                </div>
                                                {suggestions.map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors font-medium flex items-center justify-between"
                                                        onClick={() => {
                                                            const words = field.value.split(/\s/);
                                                            words.pop();
                                                            const newValue = [...words, `#${tag} `].join(" ");
                                                            field.onChange(newValue);
                                                            setSuggestions([]);
                                                        }}
                                                    >
                                                        #{tag}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <FormMessage className="text-xs px-2" />
                                    </FormItem>
                                )}
                            />

                            {previewUrl && (
                                <div className="relative mt-2 rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                                    <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-72 object-contain" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={clearSelectedFile}
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-blue-500 hover:bg-blue-500/10 rounded-full"
                                    >
                                        <ImageIcon size={20} />
                                    </Button>

                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        placeholder="Or paste image link..."
                                                        className="border-none h-8 text-xs focus-visible:ring-0 bg-transparent text-muted-foreground"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            if (e.target.value) setPreviewUrl(e.target.value);
                                                        }}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={uploading || (!form.watch('content') && !previewUrl)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 font-bold transition-all disabled:opacity-50"
                                >
                                    {uploading ? "Posting..." : "Post Now"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}