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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
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

            toast({ title: "Updated", description: "Post updated successfully!" });
            setOpen(false);
        } catch (error) {
            console.error("Update error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update post" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Post</DialogTitle>
                    <DialogDescription>Update the details of your post below.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="imageUrl" render={({ field }) => (
                            <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}