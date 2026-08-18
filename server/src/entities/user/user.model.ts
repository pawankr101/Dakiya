import type { Static } from "typebox";
import type { DeviceSchema, UserRelationshipSchema, UserSchema, UserSettingsSchema } from "./user.schema";

export interface User extends Static<typeof UserSchema> { }
export interface UserSettings extends Static<typeof UserSettingsSchema> { }
export interface Device extends Static<typeof DeviceSchema> { }
export interface UserRelationship extends Static<typeof UserRelationshipSchema> { }
