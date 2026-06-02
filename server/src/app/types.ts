import type { FastifyReply, FastifyRequest } from "fastify";
import type { ApiResponse } from "./response";

export type EndPointHandler = (request: FastifyRequest, response: FastifyReply) => Promise<ApiResponse>
