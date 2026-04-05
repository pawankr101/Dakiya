export enum MessageType { Text = 'text', Media = 'media', Location = 'location', Poll = 'poll', Event = 'event' }
export enum MessageStatus { Sent = 'sent', Delivered = 'delivered', Read = 'read' }
export enum MediaParentType { Message = 'message', User = 'user', Conversation = 'conversation' }
export enum MediaType { Photo = 'photo', Video = 'video', Audio = 'audio', Document = 'document' }

export interface MessageContent {
    text?: string;
    mediaCaption?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    pollQuestion?: string;
    pollOptions?: string[];
    pollMultipleAnswers?: boolean;
    pollExpiresAt?: Date;
    eventTitle?: string;
    eventDescription?: string;
    eventStartTime?: Date;
    eventEndTime?: Date;
}

export interface Message {
    uid: string;
    conversationId: string;
    senderId: string;
    type: MessageType;
    content: MessageContent;
    status: MessageStatus;
    sentAt: Date;
    deliveredAt?: Date;
    readAt?: Date;
    replyToMessageId?: string;
    isForwarded: boolean;
    isEncrypted: boolean;
    encryptionAlgorithm?: string;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MessageReaction {
    uid: string;
    messageId: string;
    userId: string;
    reaction: string; // Emoji string
    isRemoved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MessageEdit {
    uid: string;
    messageId: string;
    editorId: string;
    previousType: MessageType;
    previousContent: MessageContent; // JSONB
    newType: MessageType;
    newContent: MessageContent;    // JSONB
    editedAt: Date;
    createdAt: Date;
}

export interface Media {
    uid: string;
    parentType: MediaParentType;
    parentId: string; // Foreign key to Message, User, or Conv
    type: MediaType;
    fileName?: string;
    remotePath: string;
    mimeType?: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    createdAt: Date;
    updatedAt: Date;
}
