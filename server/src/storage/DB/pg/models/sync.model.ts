export interface DeliveryQueueItem {
    uid: string;
    recipientDeviceId: string;
    deliveryItemType: 'message' | 'reaction' | 'edit' | 'read_receipt';
    deliveryItemId: string; // FK to the item being delivered
    createdAt: Date;
}
