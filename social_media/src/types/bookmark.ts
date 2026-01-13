import { Timestamp } from "firebase/firestore";

export interface BookmarkRow {
    id: string;
    postId: string;
    title: string;
    savedAt: Timestamp;
}