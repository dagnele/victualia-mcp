FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY src ./src
COPY tsconfig.json ./

# Build the application
RUN bun build src/index.ts --compile --outfile victualia-mcp

# Production stage - minimal image
FROM debian:bookworm-slim

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the compiled binary
COPY --from=builder /app/victualia-mcp /app/victualia-mcp

# Set environment variables
ENV VICTUALIA_API_URL=https://www.victualia.app/api/v1
ENV VICTUALIA_OPENAPI_URL=https://www.victualia.app/api/v1/openapi.json

# Run the server
ENTRYPOINT ["/app/victualia-mcp"]
