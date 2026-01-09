import * as z from "zod";

export const postSchema = z.object({
    title: z.string(),
    content: z.string(),
    imageUrl: z.string().url("Please enter a valid image URL").or(z.string().optional()),
});

export type PostFormValues = z.infer<typeof postSchema>;