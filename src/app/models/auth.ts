import { User } from "./user";

export interface AuthRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface RegisterRequest {
    username: string;
    password: string;
    displayName: string;
    profilePicture?: string;
}