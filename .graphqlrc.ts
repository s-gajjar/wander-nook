import { ApiType, shopifyApiProject } from "@shopify/api-codegen-preset";

export const config = {
  schema: "https://shopify.dev/storefront-graphql-direct-proxy",
  documents: ["**/*.ts", "**/*.tsx", "!node_modules/**/*", "!.next/**/*"],
  projects: {
    default: shopifyApiProject({
      apiType: ApiType.Storefront,
      apiVersion: process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-07",
      outputDir: "./src/types",
    }),
  },
};

export default config;
