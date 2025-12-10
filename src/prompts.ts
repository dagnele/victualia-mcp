import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register all Victualia prompts with the MCP server
 */
export function registerPrompts(server: McpServer): void {
  // Main assistant prompt with full context about Victualia capabilities
  server.prompt(
    "victualia-assistant",
    "A helpful assistant for managing your home inventory, recipes, meal plans, shopping lists, assets, tasks, and events using the Victualia app",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are a helpful home management assistant powered by the Victualia API. You help users manage their household through the following features:

## Core Capabilities

### Homes
- Users can have multiple homes (e.g., main residence, vacation home)
- Each home has its own inventory, recipes, meal plans, etc.
- Always identify the user's home first using \`listhomes\` before performing operations
- If the user has multiple homes, ask which one they want to work with

### Inventory Items
- Track food and non-food items in the home
- Items have locations (fridge, pantry, freezer, etc.), categories, quantities, and expiration dates
- Use \`listitems\` to see current inventory, filter by category, location, or expiring items
- Help users track what they have and what's running low (check \`reorderQuantity\`)
- Use \`updateitemquantity\` to adjust stock levels when items are used or purchased

### Recipes
- Create, view, and manage recipes with ingredients and step-by-step instructions
- Recipes include prep time, cook time, servings, difficulty, cuisine, and dietary tags
- When creating recipes, suggest using ingredients the user already has in their inventory
- Use \`createshoppinglistfromrecipe\` to generate shopping lists for missing ingredients

### Meal Plans
- Weekly meal planning with breakfast, lunch, dinner, snacks, and desserts
- Assign recipes to specific days and meal types
- Help users plan balanced meals throughout the week

### Shopping Lists
- Create and manage shopping lists with items to collect
- Track collected quantities and item status (to-collect, collected, unavailable)
- Can be generated from recipes or created manually

### Assets
- Track household assets like appliances, electronics, furniture
- Store purchase dates, warranty info, serial numbers
- Attach documents (receipts, manuals, warranties)
- Categories: electronics, furniture, garden-outdoor, household, hvac, kitchen-appliances, laundry, tools-hardware

### Tasks
- Create and manage household tasks and to-dos
- Support for recurring tasks with rrule
- Tasks can have subtasks (parent-child relationship)

### Events
- Schedule events like maintenance, appointments, deliveries, payments, reminders
- Support for recurring events
- Can be linked to assets (e.g., appliance maintenance schedules)

## Best Practices

1. **Start by identifying the home**: Always call \`listhomes\` first to get the homeId needed for other operations.

2. **Be proactive**: When users ask about cooking, suggest recipes based on their current inventory. When items are low, suggest adding them to the shopping list.

3. **Provide summaries**: After fetching data, summarize it in a user-friendly way rather than showing raw JSON.

4. **Suggest related actions**: After creating a recipe, offer to add it to a meal plan. After completing a shopping trip, offer to update inventory.

5. **Track expiration**: Alert users to items expiring soon using the \`expiresInDays\` filter.

6. **Create complete recipes**: When creating recipes, include all fields: ingredients with quantities and units, detailed steps with durations, prep/cook times, servings, difficulty, cuisine, and dietary tags if applicable.

## Example Interactions

- "What's in my fridge?" -> Use \`listitems\` with location filter
- "What's expiring this week?" -> Use \`listitems\` with \`expiresInDays: 7\`
- "Create a recipe using my chicken" -> Check inventory, create a recipe with available ingredients
- "Plan my meals for the week" -> Create a meal plan and add entries for each day
- "I need to buy groceries" -> Create a shopping list or show items that need reordering
- "When does my dishwasher warranty expire?" -> Check assets for warranty info

Remember to be helpful, proactive, and make home management easy and enjoyable!`
            }
          }
        ]
      };
    }
  );

  // Weekly meal planner prompt
  server.prompt(
    "weekly-meal-planner",
    "Help create a balanced weekly meal plan based on available ingredients and preferences",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Please help me create a weekly meal plan.

Please:
1. First, check my home inventory using \`listhomes\` then \`listitems\` to see what ingredients I have available
2. Check my existing recipes using \`listrecipes\`
3. Create a balanced meal plan that:
   - Uses ingredients I already have when possible
   - Includes variety across the week
   - Balances nutrition (proteins, vegetables, grains)
4. For any meals that need new recipes, create them using \`createrecipe\`
5. Create the meal plan using \`createmealplan\` and add entries with \`addmealplanentry\`
6. Finally, identify any ingredients I'll need to buy and offer to create a shopping list

Please present the final meal plan in a clear, organized format showing each day's meals.`
            }
          }
        ]
      };
    }
  );

  // Inventory check prompt
  server.prompt(
    "inventory-check",
    "Review inventory status, find expiring items, and identify items that need restocking",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Please review my home inventory and provide a comprehensive status report.

Instructions:
1. Get my home using \`listhomes\`
2. Check for items expiring soon using \`listitems\` with \`expiresInDays: 7\` filter
3. Check for items that need restocking using \`listitems\` with \`toReorder: true\` filter
4. Provide a summary by location and category
5. For expiring items: suggest recipes that could use them up
6. For low-stock items: offer to add them to a shopping list
7. Provide a summary with counts and any recommendations

Please make the report easy to scan and act upon.`
            }
          }
        ]
      };
    }
  );

  // Recipe from ingredients prompt
  server.prompt(
    "recipe-from-ingredients",
    "Create a recipe based on ingredients currently available in the inventory",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Please create a recipe using ingredients I already have at home.

Instructions:
1. Get my home using \`listhomes\`
2. Fetch my current inventory using \`listitems\` to see available ingredients
3. Analyze what ingredients work well together
4. Create a delicious recipe using \`createrecipe\` that:
   - Primarily uses ingredients I already have
   - Includes complete ingredient list with quantities and units
   - Has clear, step-by-step instructions with time estimates
5. After creating, offer to:
   - Add it to a meal plan
   - Create a shopping list for any optional ingredients that would enhance it

Please describe the recipe in an appetizing way!`
            }
          }
        ]
      };
    }
  );

  // Shopping list helper prompt
  server.prompt(
    "shopping-helper",
    "Create a shopping list based on low-stock items, recipes, or meal plans",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Please help me create a shopping list.

Instructions:
1. Get my home using \`listhomes\`
2. Check what items need restocking using \`listitems\` with \`toReorder: true\`
3. Check my active meal plans using \`listmealplans\` to see if there are planned recipes
4. Create a comprehensive shopping list using \`createshoppinglist\` that includes:
   - Items that are running low
   - Ingredients needed for upcoming meal plans
5. Add items to the list using \`addshoppinglistitem\`
6. Organize items by category for easier shopping

Present the final shopping list in a clear format, grouped by category.`
            }
          }
        ]
      };
    }
  );

  // Asset management prompt
  server.prompt(
    "asset-manager",
    "Help manage household assets, warranties, and maintenance schedules",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Please help me manage my household assets.

Instructions:
1. Get my home using \`listhomes\`
2. List all assets using \`listassets\`
3. Provide a summary including:
   - Assets organized by category and location
   - Warranties expiring soon
   - Purchase values and expected lifespans
4. Check for any scheduled maintenance events using \`listevents\`
5. Suggest any maintenance that might be due based on asset age

Present the information in a clear, organized format. Highlight any warranties expiring in the next 30 days.`
            }
          }
        ]
      };
    }
  );
}
