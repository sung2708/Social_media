export interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    imageUrl?: string;
    likes: number;
    comments: number;
    commentsCount: number;
    createdAt: Date;
    likedBy: string[];
}