/**
 * API client for making requests to the Victualia API
 */

import { config } from "./config.js";
import type { ToolDefinition, ApiResponse } from "./types.js";

/**
 * Make an API request based on a tool definition and arguments
 */
export async function makeApiRequest(
  tool: ToolDefinition,
  args: Record<string, unknown>
): Promise<ApiResponse> {
  const url = buildUrl(tool, args);
  const headers = buildHeaders(tool, args);
  const options = buildRequestOptions(tool, args, headers);

  const response = await fetch(url, options);

  return parseResponse(response);
}

/**
 * Build the full URL with path and query parameters
 */
function buildUrl(
  tool: ToolDefinition,
  args: Record<string, unknown>
): string {
  let url = `${config.apiBaseUrl}${tool.path}`;

  // Replace path parameters
  for (const param of tool.parameters.filter((p) => p.in === "path")) {
    const value = args[param.name];
    if (value !== undefined) {
      url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
    }
  }

  // Add query parameters
  const queryParams = new URLSearchParams();
  for (const param of tool.parameters.filter((p) => p.in === "query")) {
    const value = args[param.name];
    if (value !== undefined) {
      queryParams.append(param.name, String(value));
    }
  }

  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
}

/**
 * Build request headers including auth and parameter headers
 */
function buildHeaders(
  tool: ToolDefinition,
  args: Record<string, unknown>
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  // Add header parameters
  for (const param of tool.parameters.filter((p) => p.in === "header")) {
    const value = args[param.name];
    if (value !== undefined) {
      headers[param.name] = String(value);
    }
  }

  return headers;
}

/**
 * Build the fetch request options
 */
function buildRequestOptions(
  tool: ToolDefinition,
  args: Record<string, unknown>,
  headers: Record<string, string>
): RequestInit {
  const options: RequestInit = {
    method: tool.method,
    headers,
  };

  // Add request body for methods that support it
  if (["POST", "PUT", "PATCH"].includes(tool.method) && args.body) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(args.body);
  }

  return options;
}

/**
 * Parse the API response
 */
async function parseResponse(response: Response): Promise<ApiResponse> {
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
