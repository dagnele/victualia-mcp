/**
 * OpenAPI specification fetching and parsing
 */

import { config } from "./config.js";
import type {
  OpenAPISpec,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIPathItem,
  ToolDefinition,
} from "./types.js";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

/**
 * Fetch the OpenAPI specification from the configured URL
 */
export async function fetchOpenAPISpec(): Promise<OpenAPISpec> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(config.openApiUrl, { headers });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<OpenAPISpec>;
}

/**
 * Create an empty/default OpenAPI spec for fallback scenarios
 */
export function createEmptySpec(): OpenAPISpec {
  return {
    openapi: "3.0.0",
    info: { title: "Victualia API", version: "1.0.0" },
    paths: {},
  };
}

/**
 * Convert an OpenAPI operation to a tool definition
 */
function operationToTool(
  path: string,
  method: string,
  operation: OpenAPIOperation,
  pathParameters: OpenAPIParameter[] = []
): ToolDefinition {
  const operationId =
    operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const name = operationId.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

  const description = [
    operation.summary,
    operation.description,
    `[${method.toUpperCase()} ${path}]`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const allParameters = [...pathParameters, ...(operation.parameters || [])];

  return {
    name,
    description,
    method: method.toUpperCase(),
    path,
    parameters: allParameters,
    requestBody: operation.requestBody,
  };
}

/**
 * Convert an OpenAPI spec to an array of tool definitions
 */
export function specToTools(spec: OpenAPISpec): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const pathParameters = pathItem.parameters || [];

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as OpenAPIPathItem)[method];
      if (operation) {
        tools.push(operationToTool(path, method, operation, pathParameters));
      }
    }
  }

  return tools;
}
