/**
 * Configuration for the Victualia MCP server
 */

export const config = {
  /** URL to fetch the OpenAPI specification from */
  openApiUrl: process.env.VICTUALIA_OPENAPI_URL || "https://www.victualia.app/api/v1/openapi.json",
  
  /** Base URL for API requests */
  apiBaseUrl: process.env.VICTUALIA_API_URL || "https://www.victualia.app/api/v1",
  
  /** API key for authentication */
  apiKey: process.env.VICTUALIA_API_KEY || "",
  
  /** Server metadata */
  server: {
    name: "victualia-mcp",
    version: "1.1.0",
  },
} as const;
