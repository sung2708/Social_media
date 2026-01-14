import type { Timestamp } from "firebase/firestore";

export interface Comment {
    id: string;
    text: string;
    userId: string;
    userEmail: string;
    userAvatar: string;
    createdAt: Timestamp;
}