import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import { getProductByHandleQuery, getProductsQuery } from "../queries/product";
import {
  CartCreateMutation,
  CartCreateMutationVariables,
  GetAllProductsQuery,
  GetProductByHandleQuery,
} from "../types/storefront.generated";
import { createCartMutation } from "../queries/cart";

function getClient() {
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ?? "";
  const apiVersion = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-07";
  const publicAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STORE_FRONT_ACCESS_TOKEN;
  return createStorefrontApiClient({ storeDomain, apiVersion, publicAccessToken });
}

function getAdminClient() {
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ?? "";
  const apiVersion = "2025-07";
  const publicAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  return createStorefrontApiClient({ storeDomain, apiVersion, publicAccessToken });
}

export async function getAllProducts(): Promise<
  GetAllProductsQuery | undefined
> {
  try {
    const { data, errors } = await getClient().request(getProductsQuery);

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
    const { data, errors } = await getClient().request(getProductByHandleQuery, {
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
    const { data, errors } = await getClient().request(createCartMutation, {
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

export async function createSubscriptionContract(
  customerId: string,
  sellingPlanId: string,
  productVariantId: string,
  quantity: number = 1
) {
  try {
    const subscriptionContractMutation = `
      mutation subscriptionContractCreate($input: SubscriptionContractCreateInput!) {
        subscriptionContractCreate(input: $input) {
          contract { id status nextBillingDate }
          userErrors { field message }
        }
      }
    `;

    const { data, errors } = await getAdminClient().request(subscriptionContractMutation, {
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

export async function getSellingPlans(): Promise<Array<{ id: string; name?: string }>> {
  try {
    const query = `#graphql
      query GetSellingPlans($first: Int!) {
        sellingPlanGroups(first: $first) {
          edges { node { id name sellingPlans(first: 10) { edges { node { id name } } } } }
        }
      }
    `;

    const { data, errors } = await getClient().request(query as any, {
      variables: { first: 10 },
    });

    if (errors) {
      console.error("Shopify selling plans errors:", errors);
      return [];
    }

    const groups = (data as any)?.sellingPlanGroups?.edges ?? [];
    const plans = groups.flatMap((g: any) => g?.node?.sellingPlans?.edges ?? []);
    return plans.map((e: any) => e?.node).filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch selling plans", error);
    return [];
  }
}
