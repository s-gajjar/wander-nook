#!/usr/bin/env node
/**
 * Razorpay Docs MCP wrapper — calls @razorpay-docs/mcp as a CLI tool.
 * Usage: node razorpay-docs.mjs <query>
 * 
 * Requires: npx @razorpay-docs/mcp (auto-installed on first run)
 */
import { execSync } from "child_process";

const query = process.argv.slice(2).join(" ");
if (!query) {
  console.log("Usage: node razorpay-docs.mjs <query>");
  console.log("Examples:");
  console.log('  node razorpay-docs.mjs "create order API"');
  console.log('  node razorpay-docs.mjs "webhook signature verification"');
  console.log('  node razorpay-docs.mjs "subscription billing cycle"');
  process.exit(1);
}

try {
  const result = execSync(
    `npx -y @razorpay-docs/mcp query "${query.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
  );
  console.log(result);
} catch (e) {
  // Fallback: search razorpay docs site directly
  console.log(`MCP query failed, trying direct docs fetch...`);
  try {
    const docsResult = execSync(
      `curl -sL "https://razorpay.com/docs/api/" 2>/dev/null | head -200`,
      { encoding: "utf-8", timeout: 15000 }
    );
    console.log(docsResult);
  } catch (e2) {
    console.error("Could not reach Razorpay docs. Check network.");
    process.exit(1);
  }
}
