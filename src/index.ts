#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { config } from "./config.js";
import { fetchOpenAPISpec, createEmptySpec, specToTools } from "./openapi.js";
import { makeApiRequest } from "./api-client.js";
import { buildParameterSchema, buildRequestBodySchema } from "./schema.js";
import { registerPrompts } from "./prompts.js";
import type { OpenAPISpec, ToolDefinition } from "./types.js";

/**
 * Register all API tools from the OpenAPI spec with the MCP server
 */
function registerApiTools(
  server: McpServer,
  tools: ToolDefinition[],
  spec: OpenAPISpec
): void {
  for (const tool of tools) {
    // Build the shape object for tool parameters
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const param of tool.parameters) {
      shape[param.name] = buildParameterSchema(param);
    }

    // Add body parameter if request body is expected
    if (tool.requestBody) {
      const bodySchema = buildRequestBodySchema(tool.requestBody, spec);
      if (bodySchema) {
        shape["body"] = bodySchema;
      }
    }

    // Register the tool
    server.tool(tool.name, tool.description, shape, async (args) => {
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
    });
  }
}

/**
 * Register utility tools for API discovery
 */
function registerUtilityTools(
  server: McpServer,
  tools: ToolDefinition[],
  spec: OpenAPISpec
): void {
  // List all available API endpoints
  server.tool(
    "list_endpoints",
    "List all available Victualia API endpoints",
    {},
    async () => {
      const endpoints = tools.map((t) => ({
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

  // Get API info
  server.tool(
    "api_info",
    "Get information about the Victualia API",
    {},
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                title: spec.info.title,
                version: spec.info.version,
                description: spec.info.description,
                baseUrl: config.apiBaseUrl,
                totalEndpoints: tools.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

/**
 * Main entry point
 */
async function main() {
  console.error("Victualia MCP Server starting...");

  // Fetch OpenAPI spec
  let spec: OpenAPISpec;
  let tools: ToolDefinition[];

  try {
    console.error(`Fetching OpenAPI spec from ${config.openApiUrl}...`);
    spec = await fetchOpenAPISpec();
    tools = specToTools(spec);
    console.error(`Loaded ${tools.length} tools from OpenAPI spec`);
  } catch (error) {
    console.error(`Failed to fetch OpenAPI spec: ${error}`);
    console.error(
      "Starting with no tools. Set VICTUALIA_API_KEY environment variable if authentication is required."
    );
    spec = createEmptySpec();
    tools = [];
  }

  // Create MCP server
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  // Register tools and prompts
  registerApiTools(server, tools, spec);
  registerUtilityTools(server, tools, spec);
  registerPrompts(server);

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Victualia MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
