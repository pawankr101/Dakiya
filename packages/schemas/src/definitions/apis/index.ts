import { ApiSchema } from "./api";

export * from "./sync";
export * from "./system";

export const ApiErrorSchema = ApiSchema.error({ $id: 'ApiErrorSchema', description: 'API Error Response Schema' });
export const ApiErrorWithIssuesSchema = ApiSchema.error({ $id: 'ApiErrorWithIssuesSchema', withValidationIssues: true, description: 'API Error Response Schema with Validation Issues' });
