import { Model } from "@nozbe/watermelondb";
import { text, field } from "@nozbe/watermelondb/decorators";

export class Media extends Model {
    static table = 'media';

    @text('uid') uid: string;

    //-- Parent Entity Reference
    @text('parent_type') parent_type: 'message' | 'user' | 'conversation';
    @text('parent_id') parent_id: string;

    //-- Media File Information
    @text('type') type: 'image' | 'video' | 'audio' | 'document';
    @field('file_name') file_name: string;
    @field('local_path') local_path: string;
    @field('thumbnail_path') thumbnail_path?: string;
    @field('remote_path') remote_path: string;

    //-- Media Metadata
    @field('mime_type') mime_type?: string;
    @field('size') size?: number;
    @field('width') width?: number;
    @field('height') height?: number;
    @field('duration') duration?: number;

    @text('status') status: 'uploading' | 'uploaded' | 'downloading' | 'downloaded' | 'failed';
}
