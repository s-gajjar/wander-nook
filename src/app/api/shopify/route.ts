import {
  createCheckout,
  // createSubscriptionContract,
  getAllProducts,
  getProductByHandle,
  // getSellingPlans,
} from "@/src/lib/shopify-client";
import { CartCreateMutationVariables } from "@/src/types/storefront.generated";
import type { CartLineInput } from "@/src/types/storefront.types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const handle = searchParams.get("handle");

    if (action === "getProducts") {
      const allProducts = await getAllProducts();
      return NextResponse.json({ products: allProducts?.products ?? {} });
    }

    if (action === "getProductByHandle" && handle) {
      const product = await getProductByHandle(handle);
      const produtctImages = product?.productByHandle?.images?.edges;
      const mappedProduct = {
        id: product?.productByHandle?.id,
        title: product?.productByHandle?.title,
        handle: product?.productByHandle?.handle,
        description: product?.productByHandle?.description,
        images: produtctImages
          ? produtctImages?.map(({ node }) => ({
              id: node?.id,
              src: node?.src,
              altText: node?.altText,
              width: node?.width,
              height: node?.height,
            }))
          : [],
        productType: product?.productByHandle?.productType,
        vendor: product?.productByHandle?.vendor,
      };
      return NextResponse.json({ product: mappedProduct });
    }

    if (action === "getSellingPlans") {
      // Return an empty list to avoid server errors; client uses env-configured plan IDs
      return NextResponse.json({ sellingPlans: [] });
    }

    return NextResponse.json(
      {
        message: "Action is invalid or missing",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error("Error fetching data from Shopify", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "checkout") {
      const body = await request.json();
      const { items, checkoutMeta } = body as {
        items?: Array<{
          attributes?: Array<{ key: string; value: string }>;
          quantity?: number;
          merchandiseId?: string;
          sellingPlanId?: string;
        }>;
        checkoutMeta?: Record<string, unknown>;
      };

      if (!items || !Array.isArray(items) || items?.length === 0) {
        return NextResponse.json(
          {
            message: "No items provided for checkout",
          },
          { status: 400 }
        );
      }

      const hasInvalidLines = items.some(
        (item) =>
          !item?.merchandiseId ||
          typeof item.merchandiseId !== "string" ||
          !item.merchandiseId.startsWith("gid://shopify/ProductVariant/") ||
          !item?.quantity ||
          typeof item.quantity !== "number" ||
          item.quantity < 1
      );

      if (hasInvalidLines) {
        return NextResponse.json(
          {
            message: "Invalid line items provided for checkout",
          },
          { status: 400 }
        );
      }

      const hasMissingSellingPlan = items.some(
        (item) =>
          !item?.sellingPlanId ||
          typeof item.sellingPlanId !== "string" ||
          item.sellingPlanId.trim().length === 0
      );

      if (hasMissingSellingPlan) {
        return NextResponse.json(
          {
            message: "Autopay selling plan is required for checkout",
          },
          { status: 400 }
        );
      }

      const safeLines: CartLineInput[] = items.map((item) => ({
        merchandiseId: item.merchandiseId!,
        quantity: item.quantity!,
        sellingPlanId: item.sellingPlanId!,
        ...(item.attributes?.length
          ? {
              attributes: item.attributes.map((attribute) => ({
                key: attribute.key,
                value: attribute.value,
              })),
            }
          : {}),
      }));

      const safeCheckoutAttributes = Object.entries(checkoutMeta ?? {})
        .filter(
          ([key, value]) =>
            key.trim().length > 0 &&
            ["string", "number", "boolean"].includes(typeof value)
        )
        .slice(0, 20)
        .map(([key, value]) => ({
          key: key.slice(0, 255),
          value: String(value).slice(0, 255),
        }));

      const cartInput: CartCreateMutationVariables["input"] = {
        lines: safeLines,
        attributes: [
          { key: "checkout_source", value: "wanderstamps-autopay" },
          ...safeCheckoutAttributes,
        ],
      };

      const cart = await createCheckout(cartInput);

      if ((cart?.cartCreate?.userErrors?.length ?? 0) > 0) {
        return NextResponse.json(
          {
            message: cart?.cartCreate?.userErrors?.[0]?.message ?? "Checkout failed",
            errors: cart?.cartCreate?.userErrors ?? [],
          },
          { status: 400 }
        );
      }

      const checkout = {
        cartId: cart?.cartCreate?.cart?.id,
        checkoutUrl: cart?.cartCreate?.cart?.checkoutUrl,
        totalQuantity: cart?.cartCreate?.cart?.totalQuantity,
        cost: cart?.cartCreate?.cart?.cost,
      };

      if (!checkout.cartId || !checkout.checkoutUrl) {
        return NextResponse.json(
          {
            message: "Checkout session could not be created",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        checkout,
      });
    }

    return NextResponse.json(
      {
        message: "Action is invalid or missing",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error("Error performing operation from Shopify", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
