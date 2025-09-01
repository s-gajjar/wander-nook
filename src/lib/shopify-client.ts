import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import { getProductByHandleQuery, getProductsQuery } from "../queries/product";
import {
  CartCreateMutation,
  CartCreateMutationVariables,
  GetAllProductsQuery,
  GetProductByHandleQuery,
} from "../types/storefront.generated";
import { createCartMutation } from "../queries/cart";

const client = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ?? "",
  apiVersion: process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-07",
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STORE_FRONT_ACCESS_TOKEN,
});

export async function getAllProducts(): Promise<
  GetAllProductsQuery | undefined
> {
  try {
    const { data, errors } = await client.request(getProductsQuery);

    if (errors) {
      throw new Error(
        `"Failed to fetch products from Shopify: ${errors.message}`
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching products from Shopify", error);
    throw error;
  }
}

export async function getProductByHandle(
  handle: string
): Promise<GetProductByHandleQuery | undefined> {
  try {
    const { data, errors } = await client.request(getProductByHandleQuery, {
      variables: {
        handle,
      },
    });

    if (errors) {
      console.error("Shopify create cart errors:", errors);
      throw new Error(
        `"Failed to fetch product by handle from Shopify: ${errors.message}`
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching product by handle from Shopify", error);
    throw error;
  }
}

export async function createCheckout(
  input: CartCreateMutationVariables["input"]
): Promise<CartCreateMutation | undefined> {
  try {
    const { data, errors } = await client.request(createCartMutation, {
      variables: {
        input,
      },
    });

    if (errors) {
      console.error("Shopify create cart errors:", errors);
      throw new Error(`"Failed to create cart to Shopify: ${errors.message}`);
    }

    return data;
  } catch (error) {
    console.error("Failed to create cart to Shopify", error);
    throw error;
  }
}
