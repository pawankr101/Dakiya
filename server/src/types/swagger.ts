type ObjectOf<T=unknown> = {[x: string]: T};
type Parameter = ParameterWithSchema|ParameterWithContent;
type ParameterWithSchema = ParameterWithSchemaWithExample|ParameterWithSchemaWithExamples;
type ParameterWithSchemaWithExample = ParameterWithSchemaWithExampleInPath|ParameterWithSchemaWithExampleInQuery|ParameterWithSchemaWithExampleInHeader|ParameterWithSchemaWithExampleInCookie;
type ParameterWithSchemaWithExamples = ParameterWithSchemaWithExamplesInPath|ParameterWithSchemaWithExamplesInQuery|ParameterWithSchemaWithExamplesInHeader|ParameterWithSchemaWithExamplesInCookie;
type ParameterWithContent = ParameterWithContentInPath|ParameterWithContentNotInPath;
type MediaType = MediaTypeWithExample|MediaTypeWithExamples;
type Header = HeaderWithSchema|HeaderWithContent;
type HeaderWithSchema = HeaderWithSchemaWithExample|HeaderWithSchemaWithExamples;
type Link = LinkWithOperationRef|LinkWithOperationId;
type SecurityScheme = APIKeySecurityScheme|HTTPSecurityScheme|OAuth2SecurityScheme|OpenIdConnectSecurityScheme;
type HTTPSecurityScheme = NonBearerHTTPSecurityScheme|BearerHTTPSecurityScheme;

interface Info {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version: string;
}
interface Contact {
  name?: string;
  url?: string;
  email?: string;
}
interface License {
  name: string;
  url?: string;
}
interface ExternalDocumentation {
  description?: string;
  url: string;
}
interface Server {
  url: string;
  description?: string;
  variables?: ObjectOf<ServerVariable>;
}
interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

type SecurityRequirement = ObjectOf<string[]>
type Paths = ObjectOf<PathItem>

interface Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}
interface PathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
  servers?: Server[];
  parameters?: (Parameter|Reference)[];
}
interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: (Parameter|Reference)[];
  requestBody?: RequestBody|Reference;
  responses: Responses;
  callbacks?: ObjectOf<Callback|Reference>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: Server[];
}
interface ParameterWithSchemaWithExampleInPath {
  name: string;
  in: "path";
  description?: string;
  required: true;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "matrix"|"label"|"simple";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  example?: unknown;
}
interface Schema {
  title?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: [string, ...string[]];
  enum?: [unknown, ...unknown[]];
  type?: "array"|"boolean"|"integer"|"number"|"object"|"string";
  not?: Schema|Reference;
  allOf?: (Schema|Reference)[];
  oneOf?: (Schema|Reference)[];
  anyOf?: (Schema|Reference)[];
  items?: Schema|Reference;
  properties?: ObjectOf<Schema|Reference>;
  additionalProperties?: Schema|Reference|boolean;
  description?: string;
  format?: string;
  default?: unknown;
  nullable?: boolean;
  discriminator?: Discriminator;
  readOnly?: boolean;
  writeOnly?: boolean;
  example?: unknown;
  externalDocs?: ExternalDocumentation;
  deprecated?: boolean;
  xml?: XML;
}
interface Reference {
  $ref: string;
}
interface Discriminator {
  propertyName: string;
  mapping?: ObjectOf<string>;
}
interface XML {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}
interface ParameterWithSchemaWithExampleInQuery {
  name: string;
  in: "query";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "form"|"spaceDelimited"|"pipeDelimited"|"deepObject";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  example?: unknown;
}
interface ParameterWithSchemaWithExampleInHeader {
  name: string;
  in: "header";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "simple";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  example?: unknown;
}
interface ParameterWithSchemaWithExampleInCookie {
  name: string;
  in: "cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "form";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  example?: unknown;
}
interface ParameterWithSchemaWithExamplesInPath {
  name: string;
  in: "path";
  description?: string;
  required: true;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "matrix"|"label"|"simple";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  examples: ObjectOf<Example|Reference>;
}
interface Example {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}
interface ParameterWithSchemaWithExamplesInQuery {
  name: string;
  in: "query";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "form"|"spaceDelimited"|"pipeDelimited"|"deepObject";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  examples: ObjectOf<Example|Reference>;
}
interface ParameterWithSchemaWithExamplesInHeader {
  name: string;
  in: "header";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "simple";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  examples: ObjectOf<Example|Reference>;
}
interface ParameterWithSchemaWithExamplesInCookie {
  name: string;
  in: "cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "form";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  examples: ObjectOf<Example|Reference>;
}
interface ParameterWithContentInPath {
  name: string;
  in: "path";
  description?: string;
  required?: true;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  content: ObjectOf<MediaType>;
}
interface MediaTypeWithExample {
  schema?: Schema|Reference;
  example?: unknown;
  encoding?: ObjectOf<Encoding>;
}
interface Encoding {
  contentType?: string;
  headers?: ObjectOf<Header>;
  style?: "form"|"spaceDelimited"|"pipeDelimited"|"deepObject";
  explode?: boolean;
  allowReserved?: boolean;
}
interface HeaderWithSchemaWithExample {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "simple";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  example?: unknown;
}
interface HeaderWithSchemaWithExamples {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "simple";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  examples: ObjectOf<Example|Reference>;
}
interface HeaderWithContent {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  content: ObjectOf<MediaType>;
}
interface MediaTypeWithExamples {
  schema?: Schema|Reference;
  examples: ObjectOf<Example|Reference>;
  encoding?: ObjectOf<Encoding>;
}
interface ParameterWithContentNotInPath {
  name: string;
  in: "query"|"header"|"cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  content: ObjectOf<MediaType>;
}
interface RequestBody {
  description?: string;
  content: ObjectOf<MediaType>;
  required?: boolean;
}
interface Responses {
  default?: Response|Reference;
}
interface Response {
  description: string;
  headers?: ObjectOf<Header|Reference>;
  content?: ObjectOf<MediaType>;
  links?: ObjectOf<Link|Reference>;
}
interface LinkWithOperationRef {
  operationRef?: string;
  parameters?: ObjectOf<unknown>;
  requestBody?: unknown;
  description?: string;
  server?: Server;
}
interface LinkWithOperationId {
  operationId?: string;
  parameters?: ObjectOf<unknown>;
  requestBody?: unknown;
  description?: string;
  server?: Server;
}

type Callback = ObjectOf<PathItem>

interface Components {
  schemas?: ObjectOf<Reference|Schema>;
  responses?: ObjectOf<Reference|Response>;
  parameters?: ObjectOf<Reference|Parameter>;
  examples?: ObjectOf<Reference|Example>;
  requestBodies?: ObjectOf<Reference|RequestBody>;
  headers?: ObjectOf<Reference|Header>;
  securitySchemes?: ObjectOf<Reference|SecurityScheme>;
  links?: ObjectOf<Reference|Link>;
  callbacks?: ObjectOf<Reference|Callback>;
}
interface APIKeySecurityScheme {
  type: "apiKey";
  name: string;
  in: "header"|"query"|"cookie";
  description?: string;
}
interface NonBearerHTTPSecurityScheme {
  scheme: string;
  description?: string;
  type: "http";
}
interface BearerHTTPSecurityScheme {
  scheme: "bearer";
  bearerFormat?: string;
  type: "http";
  description?: string;
}
interface OAuth2SecurityScheme {
  type: "oauth2";
  flows: OAuthFlows;
  description?: string;
}
interface OAuthFlows {
  implicit?: ImplicitOAuthFlow;
  password?: PasswordOAuthFlow;
  clientCredentials?: ClientCredentialsFlow;
  authorizationCode?: AuthorizationCodeOAuthFlow;
}
interface ImplicitOAuthFlow {
  authorizationUrl: string;
  refreshUrl?: string;
  scopes: ObjectOf<string>;
}
interface PasswordOAuthFlow {
  tokenUrl: string;
  refreshUrl?: string;
  scopes?: ObjectOf<string>;
}
interface ClientCredentialsFlow {
  tokenUrl: string;
  refreshUrl?: string;
  scopes?: ObjectOf<string>;
}
interface AuthorizationCodeOAuthFlow {
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes?: ObjectOf<string>;
}
interface OpenIdConnectSecurityScheme {
  type: "openIdConnect";
  openIdConnectUrl: string;
  description?: string;
}
export interface SwaggerSchema {
  openapi: string;
  info: Info;
  externalDocs?: ExternalDocumentation;
  servers?: Server[];
  security?: SecurityRequirement[];
  tags?: Tag[];
  paths: Paths;
  components?: Components;
}
