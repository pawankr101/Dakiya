type ObjectOf<T=any> = {[x: string]: T};
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
type Info = {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version: string;
}
type Contact = {
  name?: string;
  url?: string;
  email?: string;
}
type License = {
  name: string;
  url?: string;
}
type ExternalDocumentation = {
  description?: string;
  url: string;
}
type Server = {
  url: string;
  description?: string;
  variables?: ObjectOf<ServerVariable>;
}
type ServerVariable = {
  enum?: string[];
  default: string;
  description?: string;
}
type SecurityRequirement = ObjectOf<string[]>
type Paths = ObjectOf<PathItem>
type Tag = {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}
type PathItem = {
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
type Operation = {
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
type ParameterWithSchemaWithExampleInPath = {
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
  example?: any;
}
type Schema = {
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
  enum?: [any, ...any[]];
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
  default?: any;
  nullable?: boolean;
  discriminator?: Discriminator;
  readOnly?: boolean;
  writeOnly?: boolean;
  example?: any;
  externalDocs?: ExternalDocumentation;
  deprecated?: boolean;
  xml?: XML;
}
type Reference = {
  $ref: string;
}
type Discriminator = {
  propertyName: string;
  mapping?: ObjectOf<string>;
}
type XML = {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}
type ParameterWithSchemaWithExampleInQuery = {
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
  example?: any;
}
type ParameterWithSchemaWithExampleInHeader = {
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
  example?: any;
}
type ParameterWithSchemaWithExampleInCookie = {
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
  example?: any;
}
type ParameterWithSchemaWithExamplesInPath = {
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
type Example = {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}
type ParameterWithSchemaWithExamplesInQuery = {
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
type ParameterWithSchemaWithExamplesInHeader = {
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
type ParameterWithSchemaWithExamplesInCookie = {
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
type ParameterWithContentInPath = {
  name: string;
  in: "path";
  description?: string;
  required?: true;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  content: ObjectOf<MediaType>;
}
type MediaTypeWithExample = {
  schema?: Schema|Reference;
  example?: any;
  encoding?: ObjectOf<Encoding>;
}
type Encoding = {
  contentType?: string;
  headers?: ObjectOf<Header>;
  style?: "form"|"spaceDelimited"|"pipeDelimited"|"deepObject";
  explode?: boolean;
  allowReserved?: boolean;
}
type HeaderWithSchemaWithExample = {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: "simple";
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema|Reference;
  example?: any;
}
type HeaderWithSchemaWithExamples = {
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
type HeaderWithContent = {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  content: ObjectOf<MediaType>;
}
type MediaTypeWithExamples = {
  schema?: Schema|Reference;
  examples: ObjectOf<Example|Reference>;
  encoding?: ObjectOf<Encoding>;
}
type ParameterWithContentNotInPath = {
  name: string;
  in: "query"|"header"|"cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  content: ObjectOf<MediaType>;
}
type RequestBody = {
  description?: string;
  content: ObjectOf<MediaType>;
  required?: boolean;
}
type Responses = {
  default?: Response|Reference;
}
type Response = {
  description: string;
  headers?: ObjectOf<Header|Reference>;
  content?: ObjectOf<MediaType>;
  links?: ObjectOf<Link|Reference>;
}
type LinkWithOperationRef = {
  operationRef?: string;
  parameters?: ObjectOf<any>;
  requestBody?: any;
  description?: string;
  server?: Server;
}
type LinkWithOperationId = {
  operationId?: string;
  parameters?: ObjectOf<any>;
  requestBody?: any;
  description?: string;
  server?: Server;
}
type Callback = ObjectOf<PathItem>
type Components = {
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
type APIKeySecurityScheme = {
  type: "apiKey";
  name: string;
  in: "header"|"query"|"cookie";
  description?: string;
}
type NonBearerHTTPSecurityScheme = {
  scheme: string;
  description?: string;
  type: "http";
}
type BearerHTTPSecurityScheme = {
  scheme: "bearer";
  bearerFormat?: string;
  type: "http";
  description?: string;
}
type OAuth2SecurityScheme = {
  type: "oauth2";
  flows: OAuthFlows;
  description?: string;
}
type OAuthFlows = {
  implicit?: ImplicitOAuthFlow;
  password?: PasswordOAuthFlow;
  clientCredentials?: ClientCredentialsFlow;
  authorizationCode?: AuthorizationCodeOAuthFlow;
}
type ImplicitOAuthFlow = {
  authorizationUrl: string;
  refreshUrl?: string;
  scopes: ObjectOf<string>;
}
type PasswordOAuthFlow = {
  tokenUrl: string;
  refreshUrl?: string;
  scopes?: ObjectOf<string>;
}
type ClientCredentialsFlow = {
  tokenUrl: string;
  refreshUrl?: string;
  scopes?: ObjectOf<string>;
}
type AuthorizationCodeOAuthFlow = {
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes?: ObjectOf<string>;
}
type OpenIdConnectSecurityScheme = {
  type: "openIdConnect";
  openIdConnectUrl: string;
  description?: string;
}
type SwaggerSchema = {
  openapi: string;
  info: Info;
  externalDocs?: ExternalDocumentation;
  servers?: Server[];
  security?: SecurityRequirement[];
  tags?: Tag[];
  paths: Paths;
  components?: Components;
}

export const SWAGGER_JSON: SwaggerSchema = {
  openapi: '3.0',
  info: {
    title: 'Application Name',
    version: '1.0.0'
  },
  paths: {
  }
}
