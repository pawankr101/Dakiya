export class UserSession {

    public sessionId: string;
    public userId: string;
    public userAgent: string;
    public ipAddress: string;

    public createdAt: Date;
    public isActive: boolean;
    public lastActiveAt: Date;
    public expiresAt: Date;
    public lastSessionId: string;
    public closedAt: Date | null;
    
}
