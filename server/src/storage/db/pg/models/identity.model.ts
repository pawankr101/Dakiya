
export interface User {
    uid: string; // UUID v7
    username: string;
    email: string;
    mobile: string;
    passwordHash: string;
    name?: string;
    dp?: string;
    bio?: string;
    dob?: Date;
    gender?: 'male' | 'female' | 'other';
    country?: string;
    isVerified: boolean;
    lastActiveAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

type PrivacyLevel = 'everyone' | 'contacts' | 'nobody';

export interface UserSettings {
    uid: string;
    userId: string;
    language: string;
    timezone: string;
    chats: {
        theme: 'light' | 'dark' | 'system';
        fontSize: 'small' | 'medium' | 'large';
        mediaAutoDownload: {
            photos: boolean;
            videos: boolean;
            audio: boolean;
            documents: boolean;
        };
    };
    notifications: {
        enabled: boolean;
        groupNotifications: boolean;
        vibration: boolean;
        sound: boolean;
        popupNotifications: boolean;
        emailNotifications: boolean;
    };
    privacy: {
        blockedContacts: string[];
        readReceipts: boolean;
        lastSeen: PrivacyLevel;
        dp: PrivacyLevel;
        about: PrivacyLevel;
    };
    backup: {
        enabled: boolean;
        backupLocation?: string;
        backupFrequency: 'daily' | 'weekly' | 'monthly';
        backupOverWifiOnly: boolean;
        lastBackupAt?: Date;
    };
    account: {
        twoFactorAuth: boolean;
        accountStatus: 'active' | 'deactivated' | 'deleted';
    };
}

export interface Device {
    uid: string;
    userId: string;
    deviceName?: string;
    platform: 'iOS' | 'Android' | 'Web' | 'Desktop';
    osName?: string;
    osVersion?: string;
    appVersion?: string;
    userAgent?: string;
    fcmToken?: string;
    lastActiveAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
