import { Exception } from "@dakiya/shared";
import { ApiException } from "app/exception";
import type { FastifyReply } from "fastify";

export const sendErrorResponse = (response: FastifyReply, error: unknown) => {
    if (error instanceof ApiException) {
        return response.status(error.httpCode).send({ error: error.message, code: error.code });
    } else {
        const exception = Exception.from(error as Error, { code: 'DAKIYA_APP_ERROR' });
        return response.status(500).send({ error: exception.message, code: exception.code });
    }
}
