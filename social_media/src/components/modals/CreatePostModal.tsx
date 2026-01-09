// components/CreatePostModal.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useShowToast } from "@/hooks/useToast";
import { postSchema } from "@/schema/post";
import type { PostFormValues } from "@/schema/post";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export function CreatePostModal() {
    const [open, setOpen] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const toast = useShowToast();

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: { title: "", content: "", imageUrl: "" },
    });

    const handleButtonClick = () => {
        if (isAuthenticated) {
            setOpen(true);
        } else {
            toast({
                title: "Login Required",
                description: "You need to log in to create a post!",
                variant: "destructive",
            });
        }
    };

    const onSubmit = async (data: PostFormValues) => {
        if (!isAuthenticated || !user) return;
        try {
            await addDoc(collection(db, "posts"), {
                ...data,
                authorId: user.uid,
                authorName: user.displayName || user.email?.split('@')[0] || "Anonymous",
                authorAvatarUrl: user.photoURL || "",
                likes: 0,
                likedBy: [],
                commentsCount: 0,
                createdAt: serverTimestamp(),
            });

            toast({ title: "Success", description: "Post has been created!", variant: "success" });
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error creating post:", error);
            toast({ variant: "destructive", title: "Error", description: "Cannot create post." });
        }
    };

    return (
        <>
            <Button onClick={handleButtonClick} variant="outline" className="flex gap-2">
                <Plus size={18} />
                Create Post
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Post</DialogTitle>
                        <DialogDescription>
                            Share your thoughts with everyone.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tiêu đề</FormLabel>
                                        <FormControl><Input placeholder="Enter title..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link ảnh</FormLabel>
                                        <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content</FormLabel>
                                        <FormControl><Textarea rows={4} placeholder="What are you thinking?" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Posting..." : "Post"}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}