import { Model } from "@nozbe/watermelondb";
import { text, field } from "@nozbe/watermelondb/decorators";

export class User extends Model {
    static table = 'users';
    @text('uid') uid: string;

    @text('username') username: string;
    @text('email') email?: string; // if privacy settings allow
    @text('mobile') mobile: string;

    // -- Profile Information
    @field('name') name: string;
    @field('bio') bio?: string;
    @field('dp') dp?: string; // if privacy settings allow
    @field('dob') dob?: number; // if privacy settings allow
    @field('gender') gender?: string; // if privacy settings allow
    @field('country') country?: string; // if privacy settings allow

    //-- Security & Status
    @field('is_verified') is_verified: boolean;
    @field('last_active_at') last_active_at?: number; // if privacy settings allow

    @field('is_contact') is_contact: boolean; // whether this user is in the profile owner's contact list
    @field('local_name') local_name?: string; // nickname set by the profile owner
}
