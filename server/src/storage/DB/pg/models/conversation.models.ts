export interface Conversation {
    uid: string;
    isGroup: boolean;
    groupName?: string;
    groupDp?: string;
    description?: string;
    createdBy?: string;
    settings: {
        allowInvites: boolean;
        adminOnlyMessages: boolean;
        adminOnlyEditInfo: boolean;
    };
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationMember {
    uid: string;
    conversationId: string;
    userId: string;
    muteUntil: number; // 0 for not muted
    isArchived: boolean;
    isPinned: boolean;
    lastReadAt?: Date;
    isDeleted: boolean;
    joinedAt: Date;
    addedBy?: string;
    isAdmin: boolean;
    hasLeft: boolean;
}
