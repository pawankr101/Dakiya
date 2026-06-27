import type { ObjectOf } from "@dakiya/shared";
import type { HTTP_SERVER } from "config";
import type { FastifyInstance, FastifyPluginAsync, RawReplyDefaultExpression, RequestGenericInterface, RouteHandlerMethod } from "fastify";
import type { Request, Server } from "../servers/http-server";
import type { ApiResponse } from "./response";

type HttpServerConfig = typeof HTTP_SERVER;
export type AppHttpVersion = HttpServerConfig['httpVersion'];
export type AppHttpSecurity = HttpServerConfig['httpSecurity'];

type S = Server<AppHttpVersion, AppHttpSecurity>;;
type R = Request<AppHttpVersion>;
type Rs = RawReplyDefaultExpression<S>;
export type AppFastify = FastifyInstance<S, R, Rs>;
export type AppPlugin = FastifyPluginAsync<ObjectOf, S>;
export type EndPointHandler<Req extends RequestGenericInterface = RequestGenericInterface, Res = unknown> = RouteHandlerMethod<S, R, Rs, Req & {Reply: ApiResponse<Res>|Promise<ApiResponse<Res>>}>;
