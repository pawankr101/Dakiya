import type { Static } from "typebox";
import type { DeliveryQueueItemSchema } from "./message-delivery.schema.js";

export interface DeliveryQueueItem extends Static<typeof DeliveryQueueItemSchema> { }
