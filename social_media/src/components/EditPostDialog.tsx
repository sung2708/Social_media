import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { postSchema, type PostFormValues } from "@/schema/post";
import { useShowToast } from "@/hooks/useToast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Post } from "@/types/post";

export function EditPostDialog({ post }: { post: Post }) {
    const [open, setOpen] = useState(false);
    const toast = useShowToast();

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl || "",
        },
    });

    const onSubmit = async (data: PostFormValues) => {
        try {
            const postRef = doc(db, "posts", post.id);
            await updateDoc(postRef, {
                ...data,
                updatedAt: new Date(),
            });

            toast({ title: "Updated", description: "Post updated successfully!", variant: "success" });
            setOpen(false);
        } catch (error) {
            console.error("Update error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update post" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-border/50 hover:bg-accent">
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/90 backdrop-blur-xl border-border/50 p-0 overflow-hidden shadow-2xl sm:max-w-137.5">
                <DialogHeader className="p-6 border-b border-border/50">
                    <DialogTitle className="text-foreground text-xl">Edit Post</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Update the details of your post below.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        placeholder="Post Title"
                                        className="bg-muted/50 border-border/50 text-foreground px-3 focus-visible:ring-primary/50"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="imageUrl" render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        placeholder="Image URL"
                                        className="bg-muted/50 border-border/50 text-foreground px-3 focus-visible:ring-primary/50"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder="What's on your mind?"
                                        rows={6}
                                        className="bg-muted/50 border-border/50 text-foreground p-3 resize-none focus-visible:ring-primary/50"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )} />

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 rounded-full"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/20"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}