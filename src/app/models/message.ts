import { Conversation } from "./conversation";
import { User } from "./user";

export interface Message {
    id: string;
    sender: User;
    conversation: Conversation;
    content: string;
    timeStamp: Date;
    read: boolean;
}
