import { Message } from "./message";
import { User } from "./user";

export interface Conversation {
    id: string;
    name?: string;
    isgroupChat: boolean;
    participants: User[];
    messages?: Message[];
}
