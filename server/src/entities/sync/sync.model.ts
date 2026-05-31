import type { Static } from "typebox";
import type { DeliveryQueueItemSchema } from "./sync.schema";

export interface DeliveryQueueItem extends Static<typeof DeliveryQueueItemSchema> { }
