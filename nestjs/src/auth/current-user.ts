export interface AuthenticatedUser {
    id: bigint;
    name: string;
    email: string;
    role: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    sessionId: string;
}
