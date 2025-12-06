#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration
const OPENAPI_URL = process.env.VICTUALIA_OPENAPI_URL || "https://www.victualia.app/api/v1/openapi.json";
const API_BASE_URL = process.env.VICTUALIA_API_URL || "https://www.victualia.app/api/v1";
const API_KEY = process.env.VICTUALIA_API_KEY || "";

// OpenAPI types
interface OpenAPIParameter {
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

interface OpenAPIRequestBody {
  required?: boolean;
  content?: {
    [mediaType: string]: {
      schema?: Record<string, unknown>;
    };
  };
}

interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  tags?: string[];
}

interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  parameters?: OpenAPIParameter[];
}

interface OpenAPISpec {
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

interface ToolDefinition {
  name: string;
  description: string;
  method: string;
  path: string;
  parameters: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
}

// Fetch OpenAPI spec
async function fetchOpenAPISpec(): Promise<OpenAPISpec> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(OPENAPI_URL, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
  }
  
  return response.json() as Promise<OpenAPISpec>;
}

// Convert OpenAPI operation to tool definition
function operationToTool(
  path: string,
  method: string,
  operation: OpenAPIOperation,
  pathParameters: OpenAPIParameter[] = []
): ToolDefinition {
  const operationId = operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const name = operationId.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  
  const description = [
    operation.summary,
    operation.description,
    `[${method.toUpperCase()} ${path}]`
  ].filter(Boolean).join("\n\n");

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

// Convert OpenAPI spec to tool definitions
function specToTools(spec: OpenAPISpec): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  const methods = ["get", "post", "put", "patch", "delete"] as const;

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const pathParameters = pathItem.parameters || [];
    
    for (const method of methods) {
      const operation = pathItem[method];
      if (operation) {
        tools.push(operationToTool(path, method, operation, pathParameters));
      }
    }
  }

  return tools;
}

// Build Zod schema from OpenAPI parameter
function buildParameterSchema(param: OpenAPIParameter): z.ZodTypeAny {
  const schema = param.schema;
  let zodSchema: z.ZodTypeAny;

  if (schema?.enum && schema.enum.length > 0) {
    zodSchema = z.enum(schema.enum as [string, ...string[]]);
  } else {
    switch (schema?.type) {
      case "integer":
      case "number":
        zodSchema = z.number();
        break;
      case "boolean":
        zodSchema = z.boolean();
        break;
      case "array":
        zodSchema = z.array(z.any());
        break;
      default:
        zodSchema = z.string();
    }
  }

  if (!param.required) {
    zodSchema = zodSchema.optional();
  }

  if (param.description) {
    zodSchema = zodSchema.describe(param.description);
  }

  return zodSchema;
}

// Build request body schema
function buildRequestBodySchema(requestBody?: OpenAPIRequestBody): z.ZodTypeAny | null {
  if (!requestBody?.content) {
    return null;
  }

  const jsonContent = requestBody.content["application/json"];
  if (!jsonContent?.schema) {
    return null;
  }

  // For simplicity, we accept any JSON object for request bodies
  // A more sophisticated implementation would parse the full JSON schema
  const schema = z.record(z.string(), z.any()).describe("Request body (JSON object)");
  
  return requestBody.required ? schema : schema.optional();
}

// Make API request
async function makeApiRequest(
  tool: ToolDefinition,
  args: Record<string, unknown>
): Promise<unknown> {
  let url = `${API_BASE_URL}${tool.path}`;
  
  // Replace path parameters
  for (const param of tool.parameters.filter(p => p.in === "path")) {
    const value = args[param.name];
    if (value !== undefined) {
      url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
    }
  }

  // Add query parameters
  const queryParams = new URLSearchParams();
  for (const param of tool.parameters.filter(p => p.in === "query")) {
    const value = args[param.name];
    if (value !== undefined) {
      queryParams.append(param.name, String(value));
    }
  }
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  // Build headers
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  // Add header parameters
  for (const param of tool.parameters.filter(p => p.in === "header")) {
    const value = args[param.name];
    if (value !== undefined) {
      headers[param.name] = String(value);
    }
  }

  // Build request options
  const options: RequestInit = {
    method: tool.method,
    headers,
  };

  // Add request body for methods that support it
  if (["POST", "PUT", "PATCH"].includes(tool.method) && args.body) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(args.body);
  }

  const response = await fetch(url, options);
  
  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("application/json")) {
    const data = await response.json();
    return {
      status: response.status,
      statusText: response.statusText,
      data,
    };
  } else {
    const text = await response.text();
    return {
      status: response.status,
      statusText: response.statusText,
      data: text,
    };
  }
}

// Main function
async function main() {
  console.error("Victualia MCP Server starting...");
  
  // Fetch OpenAPI spec
  let spec: OpenAPISpec;
  let tools: ToolDefinition[];
  
  try {
    console.error(`Fetching OpenAPI spec from ${OPENAPI_URL}...`);
    spec = await fetchOpenAPISpec();
    tools = specToTools(spec);
    console.error(`Loaded ${tools.length} tools from OpenAPI spec`);
  } catch (error) {
    console.error(`Failed to fetch OpenAPI spec: ${error}`);
    console.error("Starting with no tools. Set VICTUALIA_API_KEY environment variable if authentication is required.");
    spec = {
      openapi: "3.0.0",
      info: { title: "Victualia API", version: "1.0.0" },
      paths: {}
    };
    tools = [];
  }

  // Create MCP server
  const server = new McpServer({
    name: "victualia-mcp",
    version: "1.0.0",
  });

  // Register tools dynamically
  for (const tool of tools) {
    // Build the shape object for tool parameters
    const shape: Record<string, z.ZodTypeAny> = {};
    
    for (const param of tool.parameters) {
      shape[param.name] = buildParameterSchema(param);
    }

    // Add body parameter if request body is expected
    if (tool.requestBody) {
      const bodySchema = buildRequestBodySchema(tool.requestBody);
      if (bodySchema) {
        shape["body"] = bodySchema;
      }
    }

    // Register the tool
    server.tool(
      tool.name,
      tool.description,
      shape,
      async (args) => {
        try {
          const result = await makeApiRequest(tool, args as Record<string, unknown>);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  // Add a utility tool to list available API endpoints
  server.tool(
    "list_endpoints",
    "List all available Victualia API endpoints",
    {},
    async () => {
      const endpoints = tools.map(t => ({
        name: t.name,
        method: t.method,
        path: t.path,
        description: t.description.split("\n")[0],
      }));
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(endpoints, null, 2),
          },
        ],
      };
    }
  );

  // Add a tool to get API info
  server.tool(
    "api_info",
    "Get information about the Victualia API",
    {},
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              title: spec.info.title,
              version: spec.info.version,
              description: spec.info.description,
              baseUrl: API_BASE_URL,
              totalEndpoints: tools.length,
            }, null, 2),
          },
        ],
      };
    }
  );

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Victualia MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
