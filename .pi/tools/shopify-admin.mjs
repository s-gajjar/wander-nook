#!/usr/bin/env node
/**
 * Shopify MCP wrapper — calls @codespar/mcp-shopify as a CLI tool.
 * Usage: node shopify-admin.mjs <action> [args...]
 *
 * Requires env vars:
 *   SHOPIFY_STORE_URL=your-store.myshopify.com
 *   SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
 *
 * Actions: products, orders, customers, inventory, webhooks
 */
import { execSync } from "child_process";

const [action, ...args] = process.argv.slice(2);

if (!action) {
  console.log("Shopify Admin CLI (via MCP)");
  console.log("");
  console.log("Usage: node shopify-admin.mjs <action> [args...]");
  console.log("");
  console.log("Actions:");
  console.log("  products list              - List products");
  console.log("  products get <id>          - Get product by ID");
  console.log("  orders list                - List orders");
  console.log("  orders get <id>            - Get order by ID");
  console.log("  customers list             - List customers");
  console.log("  inventory list             - List inventory levels");
  console.log("  webhooks list              - List webhooks");
  console.log("");
  console.log("Env vars required:");
  console.log("  SHOPIFY_STORE_URL          - your-store.myshopify.com");
  console.log("  SHOPIFY_ACCESS_TOKEN       - shpat_xxxxx");
  process.exit(1);
}

const storeUrl = process.env.SHOPIFY_STORE_URL;
const token = process.env.SHOPIFY_ACCESS_TOKEN;

if (!storeUrl || !token) {
  console.error("Error: SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN must be set");
  console.error("Add them to .env file");
  process.exit(1);
}

const baseUrl = `https://${storeUrl}/admin/api/2024-01`;

const endpoints = {
  "products list": "/products.json",
  "products get": `/products/${args[0]}.json`,
  "orders list": "/orders.json?status=any",
  "orders get": `/orders/${args[0]}.json`,
  "customers list": "/customers.json",
  "customers get": `/customers/${args[0]}.json`,
  "inventory list": "/inventory_levels.json",
  "webhooks list": "/webhooks.json",
};

const key = `${action} ${args[0] && !args[0].match(/^\d/) ? args[0] : "list"}`.trim();
const endpoint = endpoints[key] || endpoints[`${action} list`];

if (!endpoint) {
  console.error(`Unknown action: ${action} ${args.join(" ")}`);
  process.exit(1);
}

try {
  const result = execSync(
    `curl -s "${baseUrl}${endpoint}" -H "X-Shopify-Access-Token: ${token}" -H "Content-Type: application/json"`,
    { encoding: "utf-8", timeout: 15000 }
  );
  const parsed = JSON.parse(result);
  console.log(JSON.stringify(parsed, null, 2));
} catch (e) {
  console.error(`Request failed: ${e.message}`);
  process.exit(1);
}
