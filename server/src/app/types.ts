import type { HTTP_SERVER } from "config";
import type { RawReplyDefaultExpression, RequestGenericInterface, RouteHandlerMethod } from "fastify";
import type { Request, Server } from "../servers/http-server";
import type { ApiResponse } from "./response";

type HttpServerConfig = typeof HTTP_SERVER;
type S = Server<HttpServerConfig['httpVersion'], HttpServerConfig['httpSecurity']>
type R = Request<HttpServerConfig['httpVersion']>
type Rs = RawReplyDefaultExpression<S>;
export type EndPointHandler<Req extends RequestGenericInterface = RequestGenericInterface, Res = unknown> = RouteHandlerMethod<S, R, Rs, Req & {Reply: ApiResponse<Res>|Promise<ApiResponse<Res>>}>;
