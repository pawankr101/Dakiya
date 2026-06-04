import { Type } from 'typebox';

const DeliveryItemTypeSchema = Type.Union([
	Type.Literal('message'),
	Type.Literal('reaction'),
	Type.Literal('edit'),
	Type.Literal('read_receipt')
]);

export const DeliveryQueueItemSchema = Type.Object({
	id: Type.String({ format: 'uuid' }),
	recipientDeviceId: Type.String({ format: 'uuid' }),
	deliveryItemType: DeliveryItemTypeSchema,
	deliveryItemId: Type.String({ format: 'uuid' }),
	createdAt: Type.String({ format: 'date-time' })
}, { $id: 'DeliveryQueueItemSchema' });
