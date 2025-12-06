# victualia-mcp

[![CI](https://github.com/dagnele/victualia-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/dagnele/victualia-mcp/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/victualia-mcp.svg)](https://www.npmjs.com/package/victualia-mcp)

An MCP (Model Context Protocol) server for the [Victualia](https://www.victualia.app) API.

## What is Victualia?

**Victualia - Your Home, Organized**

Victualia is a lifestyle application that helps you organize your home, track household items, plan meals, and manage your life efficiently. Available on Web, iOS, and Android.

### Key Features

- **Home Inventory Tracking** - Track everything from pantry to garage
- **Barcode Scanning** - Quickly add items using the Open Food Facts database
- **AI-Powered Meal Planning** - Get personalized meal suggestions based on your preferences and available ingredients
- **Auto-Generated Shopping Lists** - Never forget what you need
- **Recipe Management & Import** - Import recipes from any website or create your own
- **Expiry Date Alerts** - Reduce food waste with timely notifications
- **Multi-Home Support** - Manage multiple properties from one account
- **Multi-Location Organization** - Organize items by location (pantry, fridge, garage, etc.)

### Supported Languages

English, Spanish, Italian, German, French, and Portuguese.

## What Does This MCP Server Do?

This server dynamically fetches the OpenAPI specification from Victualia and exposes all API endpoints as MCP tools, allowing AI assistants (Claude, OpenCode, Cursor, etc.) to interact with the Victualia API on your behalf.

With this MCP server, you can ask your AI assistant to:
- Check what items are in your pantry
- Add items to your shopping list
- Get meal plan suggestions
- Track expiring items
- Manage your recipes
- And more!

## Installation Options

### Option 1: npx (Recommended - No Installation)

```bash
VICTUALIA_API_KEY=your-api-key npx victualia-mcp
```

### Option 2: Global npm Install

```bash
npm install -g victualia-mcp
victualia-mcp
```

### Option 3: Standalone Binary

Download the pre-built binary for your platform from the [Releases](https://github.com/dagnele/victualia-mcp/releases) page:

| Platform | Binary |
|----------|--------|
| Linux (x64) | `victualia-mcp-linux-x64` |
| macOS (Intel) | `victualia-mcp-darwin-x64` |
| macOS (Apple Silicon) | `victualia-mcp-darwin-arm64` |
| Windows (x64) | `victualia-mcp-windows-x64.exe` |

```bash
# Linux/macOS
chmod +x victualia-mcp-linux-x64
./victualia-mcp-linux-x64

# Windows
victualia-mcp-windows-x64.exe
```

### Option 4: Docker

```bash
docker run -e VICTUALIA_API_KEY=your-api-key ghcr.io/dagnele/victualia-mcp:latest
```

Or with Docker Compose:

```yaml
services:
  victualia-mcp:
    image: ghcr.io/dagnele/victualia-mcp:latest
    environment:
      - VICTUALIA_API_KEY=your-api-key
```

## Getting Your API Key

API access requires a **Premium account** (€9.99/month).

To get your API key:

1. Go to [victualia.app](https://www.victualia.app) and sign up or log in
2. Subscribe to the Premium plan
3. Navigate to **Settings** > **API Keys**
4. Generate a new API key and copy it

Keep your API key secure and never share it publicly.

## Configuration

The server is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VICTUALIA_API_KEY` | API key for authentication | (required) |
| `VICTUALIA_API_URL` | Base URL for API requests | `https://www.victualia.app/api/v1` |
| `VICTUALIA_OPENAPI_URL` | URL to fetch OpenAPI spec | `https://www.victualia.app/api/v1/openapi.json` |

## Usage with AI Assistants

### Claude Desktop

Add to your Claude Desktop configuration:

- **Linux**: `~/.config/claude/claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "victualia": {
      "command": "npx",
      "args": ["-y", "victualia-mcp"],
      "env": {
        "VICTUALIA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Or using the standalone binary:

```json
{
  "mcpServers": {
    "victualia": {
      "command": "/path/to/victualia-mcp-linux-x64",
      "env": {
        "VICTUALIA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### OpenCode

Add to your `opencode.json`:

```json
{
  "mcp": {
    "victualia": {
      "command": "npx",
      "args": ["-y", "victualia-mcp"],
      "env": {
        "VICTUALIA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "victualia": {
      "command": "npx",
      "args": ["-y", "victualia-mcp"],
      "env": {
        "VICTUALIA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Built-in Tools

In addition to the dynamically generated API tools, the server provides:

| Tool | Description |
|------|-------------|
| `list_endpoints` | List all available Victualia API endpoints |
| `api_info` | Get information about the Victualia API |

## How It Works

1. On startup, the server fetches the OpenAPI specification from Victualia
2. Each API endpoint is converted into an MCP tool with:
   - The operation ID as the tool name
   - Path, query, and header parameters as tool arguments
   - Request body support for POST/PUT/PATCH methods
3. When a tool is called, the server makes the corresponding HTTP request to the Victualia API
4. Responses are returned as JSON

## Development

### Requirements

- [Bun](https://bun.sh/) v1.0.0 or later

### Setup

```bash
git clone https://github.com/dagnele/victualia-mcp.git
cd victualia-mcp
bun install
```

### Commands

```bash
# Run in development mode with hot reload
bun run dev

# Type check
bun run typecheck

# Build for npm distribution
bun run build

# Build standalone binary (current platform)
bun run build:binary

# Build binaries for all platforms
bun run build:all

# Run locally
bun start
```

### Docker Build

```bash
docker build -t victualia-mcp .
docker run -e VICTUALIA_API_KEY=your-key victualia-mcp
```

## Publishing

### Automated Releases

Publishing happens automatically when you push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will:
1. Build binaries for all platforms
2. Publish to npm
3. Push Docker image to GitHub Container Registry
4. Create a GitHub Release with binary downloads

### Manual Publishing

```bash
npm publish
```

## GitHub Actions Setup

To enable automated releases, add these secrets to your repository:

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm access token for publishing |
| `DOCKERHUB_USERNAME` | (Optional) Docker Hub username |
| `DOCKERHUB_TOKEN` | (Optional) Docker Hub access token |

## Links

- [Victualia App](https://www.victualia.app) - The Victualia application
- [GitHub Repository](https://github.com/dagnele/victualia-mcp) - Source code and issues
- [npm Package](https://www.npmjs.com/package/victualia-mcp) - npm package

## License

MIT
