
export interface Profile {
    uid: string;

    //-- Public Identifiers
    username: string;
    email: string;
    mobile: string;

    // -- Profile Information
    name: string;
    dp?: string;
    bio?: string;
    dob?: number;
    gender?: string;
    country?: string;

    // -- Security & Status
    is_verified: boolean;
    last_active_at: number;

    pinned_conversation_id?: string;

    settings: ProfileSettings;

    created_at: number;
    updated_at: number;
}

export interface ProfileSettings {
    setting_id: string;
    language: string;
    timezone: string;
    chats: {
        theme: 'light' | 'dark' | 'system';
        font_size: 'small' | 'medium' | 'large';
        media_auto_download: {
            photos: boolean;
            audio: boolean;
            videos: boolean;
            documents: boolean;
        };
    };
    backup: {
        enabled: boolean;
        frequency?: 'daily' | 'weekly' | 'monthly';
        backup_over_wifi_only: boolean;
        backup_location?: string;
        last_backup_at?: number;
    };
    account: {
        two_factor_auth: boolean;
        account_status: 'active' | 'deactivated' | 'deleted';
        linked_devices: LinkedDevice[];
    };
    privacy: {
        read_receipts: boolean;
        last_seen: 'everyone' | 'contacts' | 'nobody';
        dp: 'everyone' | 'contacts' | 'nobody';
        about: 'everyone' | 'contacts' | 'nobody';
        blocked_users: string[];
    };
    notifications: {
        enabled: boolean;
        group_notifications: boolean;
        vibration: boolean;
        sound: boolean;
        popup_notifications: boolean;
        email_notifications: boolean;
    };
}

export interface LinkedDevice {
    device_id: string;
    device_name: string;
    platform: 'ios' | 'android' | 'web' | 'desktop';
    os_name: string;
    last_active_at: number;
}
