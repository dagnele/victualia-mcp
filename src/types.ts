/**
 * OpenAPI type definitions for parsing and tool generation
 */

export interface OpenAPIParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description?: string;
  required?: boolean;
  schema?: {
    type?: string;
    format?: string;
    enum?: string[];
    default?: unknown;
  };
}

export interface OpenAPIRequestBody {
  required?: boolean;
  content?: {
    [mediaType: string]: {
      schema?: Record<string, unknown>;
    };
  };
}

export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  tags?: string[];
}

export interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  parameters?: OpenAPIParameter[];
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: {
    [path: string]: OpenAPIPathItem;
  };
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  method: string;
  path: string;
  parameters: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  data: unknown;
}
