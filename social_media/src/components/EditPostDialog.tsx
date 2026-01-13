import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, writeBatch, increment, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { postSchema, type PostFormValues } from "@/schema/post";
import { useShowToast } from "@/hooks/useToast";
import { useDebounce } from "@/hooks/useDebounce";
import { Image as ImageIcon, X, Hash } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Post } from "@/types/post";

export function EditPostDialog({ post }: { post: Post }) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(post.imageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useShowToast();

    // Hashtag States
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState("");
    const debouncedTag = useDebounce(currentTag, 400);

    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CLOUD_UPLOAD_PRESET;

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl || "",
        },
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
        if (!debouncedTag) { setSuggestions([]); return; }
        const fetchTags = async () => {
            const q = query(collection(db, "hashtags"),
                where("__name__", ">=", debouncedTag),
                where("__name__", "<=", debouncedTag + "\uf8ff"),
                limit(5));
            const snap = await getDocs(q);
            setSuggestions(snap.docs.map(d => d.id));
        };
        fetchTags();
    }, [debouncedTag]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const extractHashtags = (text: string) => {
        const hashtags = text.match(/#(\w+)/g);
        return hashtags ? Array.from(new Set(hashtags.map(t => t.slice(1).toLowerCase()))) : [];
    };

    const onSubmit = async (data: PostFormValues) => {
        setUploading(true);
        try {
            let finalImageUrl = data.imageUrl;
            const file = fileInputRef.current?.files?.[0];

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", UPLOAD_PRESET);
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: "POST", body: formData
                });
                const cloudinaryData = await response.json();
                finalImageUrl = cloudinaryData.secure_url;
            }

            const batch = writeBatch(db);
            const newHashtags = extractHashtags(data.content);
            const oldHashtags = post.hashtags || [];

            const postRef = doc(db, "posts", post.id);
            batch.update(postRef, {
                ...data,
                imageUrl: finalImageUrl,
                hashtags: newHashtags,
                updatedAt: serverTimestamp(),
            });
            const addedTags = newHashtags.filter(tag => !oldHashtags.includes(tag));
            addedTags.forEach(tag => {
                const tagRef = doc(db, "hashtags", tag);
                batch.set(tagRef, { name: tag, count: increment(1), lastUsed: serverTimestamp() }, { merge: true });
            });

            await batch.commit();
            toast({ title: "Updated", description: "Post updated successfully!", variant: "success" });
            setOpen(false);
        } catch (error) {
            console.error("Error updating post:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update post" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-full border-border/50 hover:bg-accent text-xs">
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 p-0 overflow-hidden shadow-2xl sm:max-w-[550px]">
                <DialogHeader className="p-4 border-b border-border/50">
                    <DialogTitle>Edit Post</DialogTitle>
                    <DialogDescription className="hidden">Update your post content and media</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input placeholder="Title (optional)" className="border-none text-lg font-bold px-0 focus-visible:ring-0 bg-transparent" {...field} />
                                </FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem className="relative">
                                <FormControl>
                                    <Textarea
                                        rows={5}
                                        placeholder="What's on your mind?"
                                        className="border-none text-base resize-none px-0 focus-visible:ring-0 bg-transparent"
                                        {...field}
                                        onChange={(e) => handleContentChange(e, field.onChange)}
                                    />
                                </FormControl>
                                {suggestions.length > 0 && (
                                    <div className="absolute left-0 bottom-full mb-2 w-56 bg-card border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                                        <div className="p-2 border-b border-border/50 bg-muted/30 flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
                                            <Hash size={10} /> Suggested Tags
                                        </div>
                                        {suggestions.map((tag) => (
                                            <button key={tag} type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors font-medium text-blue-500"
                                                onClick={() => {
                                                    const words = field.value.split(/\s/);
                                                    words.pop();
                                                    field.onChange([...words, `#${tag} `].join(" "));
                                                    setSuggestions([]);
                                                }}>#{tag}</button>
                                        ))}
                                    </div>
                                )}
                            </FormItem>
                        )} />

                        {previewUrl && (
                            <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                                <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-60 object-contain" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full"
                                    onClick={() => { setPreviewUrl(null); form.setValue("imageUrl", ""); }}>
                                    <X size={14} />
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2">
                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                <Button type="button" variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-500/10 rounded-full" onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon size={20} />
                                </Button>
                                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                    <Input placeholder="Image URL" className="h-8 text-xs border-none bg-transparent w-40" {...field} onChange={(e) => { field.onChange(e); setPreviewUrl(e.target.value); }} />
                                )} />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
                                <Button type="submit" disabled={uploading} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 font-bold">
                                    {uploading ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}