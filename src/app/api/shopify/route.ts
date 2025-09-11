import { NextRequest, NextResponse } from "next/server";
import {
  createCheckout,
  getAllProducts,
  getProductByHandle,
} from "@/src/lib/shopify-client";
import { CartCreateMutationVariables } from "@/src/types/storefront.generated";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "products") {
      const products = await getAllProducts();
      return NextResponse.json({ products });
    }

    if (action === "product") {
      const handle = searchParams.get("handle");
      if (!handle) {
        return NextResponse.json(
          {
            message: "Handle is required",
          },
          { status: 400 }
        );
      }

      const product = await getProductByHandle(handle);
      const mappedProduct = {
        id: product?.productByHandle?.id,
        title: product?.productByHandle?.title,
        description: product?.productByHandle?.description,
        handle: product?.productByHandle?.handle,
        images: product?.productByHandle?.images?.edges?.map(
          (edge: any) => edge.node
        ),
        variants: product?.productByHandle?.variants?.edges?.map(
          (edge: any) => edge.node
        ),
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
      const { items } = body;
      
      console.log("Checkout request body:", JSON.stringify(body, null, 2));
      
      if (!items || !Array.isArray(items) || items?.length === 0) {
        return NextResponse.json(
          {
            message: "No items provided for checkout",
          },
          { status: 400 }
        );
      }

      // Log each item to debug selling plan issues
      items.forEach((item: any, index: number) => {
        console.log(`Item ${index}:`, {
          merchandiseId: item.merchandiseId,
          sellingPlanId: item.sellingPlanId,
          quantity: item.quantity,
          attributes: item.attributes
        });
      });

      const cartInput: CartCreateMutationVariables["input"] = {
        lines: items,
      };

      console.log("Cart input:", JSON.stringify(cartInput, null, 2));

      const cart = await createCheckout(cartInput);
      
      console.log("Cart creation response:", JSON.stringify(cart, null, 2));
      
      const checkout = {
        cartId: cart?.cartCreate?.cart?.id,
        checkoutUrl: cart?.cartCreate?.cart?.checkoutUrl,
        totalQuantity: cart?.cartCreate?.cart?.totalQuantity,
        cost: cart?.cartCreate?.cart?.cost,
      };

      console.log("Final checkout object:", JSON.stringify(checkout, null, 2));

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
