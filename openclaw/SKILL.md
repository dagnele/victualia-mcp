---
name: victualia
description: Manage household inventory, recipes, meal plans, shopping lists, assets, tasks, trips, and events using the Victualia API via MCP server.
---

# Victualia Skill

Use this skill when the user wants to manage their household through Victualia - a lifestyle app for home organization.

## Capabilities

- **Home Inventory** - Track items in pantry, fridge, garage with quantities and expiration dates
- **Recipes** - Create, import, and manage recipes with ingredients and steps
- **Meal Planning** - Plan meals on a calendar with time slots
- **Shopping Lists** - Create and manage shopping lists with items to collect
- **Assets** - Track household assets (appliances, electronics) with documents and warranties
- **Task Lists** - Manage tasks and subtasks for household chores
- **Trips** - Plan trips with flights, hotels, activities, and restaurants
- **Events** - Calendar events with recurrence support

## MCP Server Setup

### Download the Server

Download the latest binary from GitHub releases:
https://github.com/dagnele/victualia-mcp/releases/tag/v1.1.0

| Platform | Binary |
|----------|--------|
| Linux (x64) | `victualia-mcp-linux-x64` |
| macOS (Intel) | `victualia-mcp-darwin-x64` |
| macOS (Apple Silicon) | `victualia-mcp-darwin-arm64` |
| Windows (x64) | `victualia-mcp-windows-x64.exe` |

### Get API Key

Fetch the API key using Doppler:
```bash
doppler secrets get VICTUALIA_API_KEY --plain
```

### Configuration

Add to your MCP configuration with the binary path and API key from Doppler.

## Usage Patterns

### Always Start by Listing Homes
Before any operation, list the user's homes to get the `homeId`:
```
Use the victualia_listhomes tool to get available homes
```

### Common Workflows

**Check pantry inventory:**
1. List homes -> get homeId
2. Use `victualia_listitems` with the homeId

**Add item to shopping list:**
1. List homes -> get homeId
2. Use `victualia_listshoppinglists` to find the list
3. Use `victualia_addshoppinglistitem` to add the item

**Create a meal plan:**
1. List homes -> get homeId
2. Use `victualia_createmealplan` with name, startDate, endDate
3. Use `victualia_upsertmealplanslot` to add meal entries

**Track expiring items:**
1. Use `victualia_listitems` with `expiresInDays` parameter

## API Reference

Base URL: `https://www.victualia.app/api/v1`

### Core Resources

| Resource | Description |
|----------|-------------|
| Homes | Multi-home support for different properties |
| Items | Inventory items with quantity, location, expiration |
| Recipes | Recipes with ingredients, steps, dietary tags |
| Meal Plans | Calendar-based meal planning with slots |
| Shopping Lists | Lists with items, quantities, collection status |
| Assets | Household assets with documents (receipts, warranties) |
| Task Lists | Tasks and subtasks with completion status |
| Trips | Trip planning with flights, hotels, activities |
| Events | Calendar events with recurrence (rrule) support |

## Important Notes

- All operations require a `homeId` - always fetch homes first
- Use ISO 8601 date format for dates (e.g., `2026-02-15`)
- Recipes support metric and imperial measurement systems
- Shopping list items have status: `to-collect`, `collected`, `unavailable`
- Events support recurrence via rrule (RFC 5545 format)
