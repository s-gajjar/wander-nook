import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import { getProductByHandleQuery, getProductsQuery } from "../queries/product";
import {
  CartCreateMutation,
  CartCreateMutationVariables,
  GetAllProductsQuery,
  GetProductByHandleQuery,
} from "../types/storefront.generated";
import { createCartMutation } from "../queries/cart";
import { createSubscriptionContractMutation, getSellingPlansQuery } from "../queries/subscription";

const client = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ?? "",
  apiVersion: process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-07",
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STORE_FRONT_ACCESS_TOKEN,
});

// Admin client for subscription management
const adminClient = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ?? "",
  apiVersion: "2025-07",
  publicAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
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

    if ((data?.cartCreate?.userErrors?.length ?? 0) > 0) {
      throw new Error(data?.cartCreate?.userErrors?.[0]?.message ?? "Failed to create cart");
    }

    return data;
  } catch (error) {
    console.error("Failed to create cart to Shopify", error);
    throw error;
  }
}

// New function for creating subscription contracts (autopay)
export async function createSubscriptionContract(
  customerId: string,
  sellingPlanId: string,
  productVariantId: string,
  quantity: number = 1
) {
  try {
    const { data, errors } = await adminClient.request(createSubscriptionContractMutation, {
      variables: {
        input: {
          customerId,
          sellingPlanId,
          productVariantId,
          quantity,
        },
      },
    });

    if (errors) {
      console.error("Shopify subscription contract errors:", errors);
      throw new Error(`Failed to create subscription contract: ${errors.message}`);
    }

    if (data?.subscriptionContractCreate?.userErrors?.length > 0) {
      throw new Error(data.subscriptionContractCreate.userErrors[0].message);
    }

    return data?.subscriptionContractCreate?.contract;
  } catch (error) {
    console.error("Failed to create subscription contract", error);
    throw error;
  }
}

// Function to get selling plans for subscription products
export async function getSellingPlans() {
  try {
    const { data, errors } = await client.request(getSellingPlansQuery, {
      variables: {
        first: 10,
      },
    });

    if (errors) {
      console.error("Shopify selling plans errors:", errors);
      throw new Error(`Failed to fetch selling plans: ${errors.message}`);
    }

    const edges = (data?.sellingPlanGroups?.edges ?? []) as Array<{ node: unknown }>;
    return edges.map((edge) => edge.node);
  } catch (error) {
    console.error("Failed to fetch selling plans", error);
    throw error;
  }
}
