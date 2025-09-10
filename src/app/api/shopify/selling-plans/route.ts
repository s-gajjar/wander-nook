import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";

function toGid(id: string) {
  if (id.startsWith("gid://")) return id;
  return `gid://shopify/ProductVariant/${id}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
      return NextResponse.json({ error: "Missing Shopify env vars" }, { status: 500 });
    }

    const body = await req.json();
    const {
      groupName = "Wander Nook Subscriptions",
      variantIds = [],
      plans = [
        { name: "Print Edition Annual", interval: "YEAR", intervalCount: 1, discountPercent: 0 },
        { name: "Digital Edition Annual", interval: "YEAR", intervalCount: 1, discountPercent: 0 },
      ],
      description = "Auto-created by API",
    } = body || {};

    if (!Array.isArray(variantIds) || variantIds.length === 0) {
      return NextResponse.json({ error: "variantIds required" }, { status: 400 });
    }

    const gidVariants = variantIds.map((v: string) => toGid(v));

    const mutation = `#graphql
      mutation sellingPlanGroupCreate($input: SellingPlanGroupInput!) {
        sellingPlanGroupCreate(input: $input) {
          sellingPlanGroup { id name sellingPlans(first: 10) { edges { node { id name } } } }
          userErrors { field message }
        }
      }
    `;

    const sellingPlans = plans.map((p: any) => ({
      name: p.name,
      options: ["Delivery every"],
      billingPolicy: {
        recurring: {
          interval: p.interval,
          intervalCount: p.intervalCount,
        },
      },
      deliveryPolicy: { recurring: { interval: p.interval, intervalCount: p.intervalCount } },
      pricingPolicies: p.discountPercent && p.discountPercent > 0 ? [
        {
          fixed: null,
          recurring: {
            adjustmentType: "PERCENTAGE",
            adjustmentValue: { percentage: p.discountPercent },
          },
        },
      ] : [],
    }));

    const input = {
      name: groupName,
      description,
      merchantCode: "wander-nook",
      position: 1,
      sellingPlans,
      resourceSelection: {
        resources: gidVariants.map((id: string) => ({ id })),
        selectionType: "INCLUDE",
      },
    };

    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-07/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": ADMIN_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: mutation, variables: { input } }),
    });

    const data = await res.json();

    const errors = data?.errors || data?.data?.sellingPlanGroupCreate?.userErrors;
    if (errors && errors.length) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const group = data?.data?.sellingPlanGroupCreate?.sellingPlanGroup;
    const ids = (group?.sellingPlans?.edges || []).map((e: any) => ({ id: e.node.id, name: e.node.name }));

    return NextResponse.json({ groupId: group?.id, plans: ids });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create selling plans" }, { status: 500 });
  }
}
