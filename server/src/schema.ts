import { Type } from 'typebox';

export const EpochTimestampSchema = Type.Number({
    minimum: 0,
    description: 'Epoch timestamp in milliseconds',
    examples: [1620034828000, 1739168283000, 1783137704453]
});
