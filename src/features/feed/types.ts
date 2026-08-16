import { type PostData } from "@/features/post";
import { type EditableAttachment } from "@/features/post/helpers/postAttachments";

export type PostPrivacy = "public" | "friends" | "private";

export interface CreatePostPayload {
    title: string;
    content: string;
    attachments: EditableAttachment[];
    privacy: PostPrivacy;
    tags: string[];
    allowComments: boolean;
    pinned: boolean;
    isSpoiler: boolean;
    communityId: string | number;
    gameTag?: string;
}

export type PostDataWithSettings = PostData & {
    pinned?: boolean;
    allowComments?: boolean;
    communityId?: string | number;
};
