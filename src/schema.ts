/**
 * Zod schema builders for converting OpenAPI schemas to Zod
 */

import { z } from "zod";
import type {
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPISpec,
} from "./types.js";

/**
 * Build a Zod schema from an OpenAPI parameter definition
 */
export function buildParameterSchema(param: OpenAPIParameter): z.ZodTypeAny {
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

/**
 * Convert a JSON Schema to a simple Zod schema
 * 
 * We avoid using zod-from-json-schema because it creates custom refinements
 * that can't be converted back to JSON Schema by the MCP SDK
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonSchemaToSimpleZod(schema: any, spec: OpenAPISpec): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.any();
  }

  // Handle $ref
  if (schema.$ref && typeof schema.$ref === "string") {
    const ref = schema.$ref as string;
    if (ref.startsWith("#/components/schemas/")) {
      const schemaName = ref.substring("#/components/schemas/".length);
      const referencedSchema = spec.components?.schemas?.[schemaName];
      if (referencedSchema) {
        return jsonSchemaToSimpleZod(referencedSchema, spec);
      }
    }
    return z.any();
  }

  const type = schema.type;
  const nullable = schema.nullable === true;

  let zodSchema: z.ZodTypeAny;

  switch (type) {
    case "string":
      if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
        zodSchema = z.enum(schema.enum as [string, ...string[]]);
      } else {
        zodSchema = z.string();
      }
      break;

    case "integer":
    case "number":
      zodSchema = z.number();
      break;

    case "boolean":
      zodSchema = z.boolean();
      break;

    case "array":
      if (schema.items) {
        zodSchema = z.array(jsonSchemaToSimpleZod(schema.items, spec));
      } else {
        zodSchema = z.array(z.any());
      }
      break;

    case "object":
      if (schema.properties && typeof schema.properties === "object") {
        const shape: Record<string, z.ZodTypeAny> = {};
        const required = Array.isArray(schema.required) ? schema.required : [];

        for (const [key, propSchema] of Object.entries(schema.properties)) {
          let propZod = jsonSchemaToSimpleZod(propSchema, spec);
          if (!required.includes(key)) {
            propZod = propZod.optional();
          }
          shape[key] = propZod;
        }
        zodSchema = z.object(shape);
      } else if (schema.additionalProperties) {
        zodSchema = z.record(z.string(), z.any());
      } else {
        zodSchema = z.object({}).passthrough();
      }
      break;

    default:
      // Handle anyOf, oneOf, allOf
      if (schema.anyOf || schema.oneOf) {
        // Simplify to z.any() for complex unions
        zodSchema = z.any();
      } else {
        zodSchema = z.any();
      }
  }

  if (nullable) {
    zodSchema = zodSchema.nullable();
  }

  if (schema.description && typeof schema.description === "string") {
    zodSchema = zodSchema.describe(schema.description);
  }

  return zodSchema;
}

/**
 * Build a request body schema from an OpenAPI request body definition
 */
export function buildRequestBodySchema(
  requestBody: OpenAPIRequestBody | undefined,
  spec: OpenAPISpec
): z.ZodTypeAny | null {
  if (!requestBody?.content) {
    return null;
  }

  const jsonContent = requestBody.content["application/json"];
  if (!jsonContent?.schema) {
    return null;
  }

  try {
    const zodSchema = jsonSchemaToSimpleZod(jsonContent.schema, spec);
    return requestBody.required ? zodSchema : zodSchema.optional();
  } catch (error) {
    // Fallback to permissive schema if conversion fails
    console.error(`Failed to convert request body schema: ${error}`);
    const fallback = z
      .record(z.string(), z.any())
      .describe("Request body (JSON object)");
    return requestBody.required ? fallback : fallback.optional();
  }
}
