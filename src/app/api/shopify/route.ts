import {
  createCheckout,
  getAllProducts,
  getProductByHandle,
} from "@/src/lib/shopify-client";
import { CartCreateMutationVariables } from "@/src/types/storefront.generated";
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
      if (!items || !Array.isArray(items) || items?.length === 0) {
        return NextResponse.json(
          {
            message: "No items provided for checkout",
          },
          { status: 400 }
        );
      }

      const cartInput: CartCreateMutationVariables["input"] = {
        lines: items,
      };

      const cart = await createCheckout(cartInput);
      const checkout = {
        cartId: cart?.cartCreate?.cart?.id,
        checkoutUrl: cart?.cartCreate?.cart?.checkoutUrl,
        totalQuantity: cart?.cartCreate?.cart?.totalQuantity,
        cost: cart?.cartCreate?.cart?.cost,
      };

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
