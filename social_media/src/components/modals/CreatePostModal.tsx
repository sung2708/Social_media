import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useShowToast } from "@/hooks/useToast";
import { postSchema } from "@/schema/post";
import type { PostFormValues } from "@/schema/post";
import { Image as ImageIcon, User, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

export function CreatePostModal() {
    const [open, setOpen] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const toast = useShowToast();

    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CLOUD_UPLOAD_PRESET;

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: { title: "", content: "", imageUrl: "" },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast({ title: "Error", description: "Please select an image file.", variant: "destructive" });
                return;
            }
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const clearSelectedFile = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (!response.ok) throw new Error("Upload to Cloudinary failed");

                const cloudinaryData = await response.json();
                finalImageUrl = cloudinaryData.secure_url;
            }

            await addDoc(collection(db, "posts"), {
                title: data.title,
                content: data.content,
                imageUrl: finalImageUrl,
                authorId: user.uid,
                authorName: user.displayName || user.email?.split('@')[0] || "User",
                authorAvatarUrl: user.photoURL || "",
                likes: 0,
                likedBy: [],
                commentsCount: 0,
                createdAt: serverTimestamp(),
            });

            toast({ title: "Success", description: "Post has been created!", variant: "success" });
            setOpen(false);
            setPreviewUrl(null);
            form.reset();
        } catch (error) {
            console.error("Error creating post:", error);
            toast({ variant: "destructive", title: "Error", description: "Unable to create post at this time." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
            <DialogTrigger asChild>
                {user ? (
                    <Card className="max-w-lg w-full cursor-pointer border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:bg-card mb-6 overflow-hidden">
                        <CardHeader className="py-4 px-6">
                            <CardTitle className="text-gray-400 font-normal text-lg transition-colors">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10 border-2 border-primary/20 transition-transform hover:scale-105">
                                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User avatar"} className="object-cover" />
                                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                                            {user.displayName?.slice(0, 2).toUpperCase() || <User size={20} />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <div className="w-full">
                                            <div className="flex items-center h-10 px-4 w-full bg-muted/50 border border-border/50 rounded-full hover:bg-muted transition-all">
                                                <span className="text-muted-foreground font-light text-sm">
                                                    Hey {user.displayName || user.email?.split('@')[0]}, what's on your mind?
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                    </Card>
                ) : (
                    <Link to="/login" className="max-w-lg w-full block mb-6">
                        <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card transition-all cursor-pointer">
                            <CardHeader className="py-4 px-6">
                                <CardTitle className="text-muted-foreground font-normal text-lg transition-colors">
                                    Create a new post
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Login to share your thoughts
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                )}
            </DialogTrigger>
            <DialogContent className="bg-card/90 backdrop-blur-xl border-border/50 p-0 overflow-hidden gap-0 shadow-2xl">
                <DialogHeader className="p-4 border-b border-border/50">
                    <DialogTitle className="text-foreground">Create new post</DialogTitle>
                </DialogHeader>

                <div className="flex gap-4 p-4">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage
                            src={user?.photoURL || ""}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                            <User size={20} />
                        </AvatarFallback>
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
                                                placeholder="Title...(optional)"
                                                className="border-none text-lg font-bold px-3 py-2 focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                rows={4}
                                                placeholder="What's on your mind?...."
                                                className="border-none text-base resize-none px-3 py-2 focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
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
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 font-bold transition-all disabled:opacity-50"
                                >
                                    {uploading ? "Loading..." : "Post Now"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}