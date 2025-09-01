/* eslint-disable */
import type * as StorefrontTypes from "./storefront.types";

export type CartCreateMutationVariables = StorefrontTypes.Exact<{
  input: StorefrontTypes.CartInput;
}>;

export type CartCreateMutation = {
  cartCreate?: StorefrontTypes.Maybe<{
    cart?: StorefrontTypes.Maybe<
      Pick<
        StorefrontTypes.Cart,
        "id" | "checkoutUrl" | "totalQuantity" | "createdAt" | "updatedAt"
      > & {
        cost: {
          totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
          subtotalAmount: Pick<
            StorefrontTypes.MoneyV2,
            "amount" | "currencyCode"
          >;
          totalTaxAmount?: StorefrontTypes.Maybe<
            Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">
          >;
        };
        lines: {
          edges: Array<{
            node:
              | (Pick<StorefrontTypes.CartLine, "id" | "quantity"> & {
                  cost: {
                    totalAmount: Pick<
                      StorefrontTypes.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                  };
                  merchandise: Pick<
                    StorefrontTypes.ProductVariant,
                    "id" | "title"
                  > & {
                    price: Pick<
                      StorefrontTypes.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                    compareAtPrice?: StorefrontTypes.Maybe<
                      Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">
                    >;
                    product: Pick<
                      StorefrontTypes.Product,
                      "id" | "title" | "handle"
                    > & {
                      featuredImage?: StorefrontTypes.Maybe<
                        Pick<StorefrontTypes.Image, "url" | "altText">
                      >;
                    };
                  };
                })
              | (Pick<
                  StorefrontTypes.ComponentizableCartLine,
                  "id" | "quantity"
                > & {
                  cost: {
                    totalAmount: Pick<
                      StorefrontTypes.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                  };
                  merchandise: Pick<
                    StorefrontTypes.ProductVariant,
                    "id" | "title"
                  > & {
                    price: Pick<
                      StorefrontTypes.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                    compareAtPrice?: StorefrontTypes.Maybe<
                      Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">
                    >;
                    product: Pick<
                      StorefrontTypes.Product,
                      "id" | "title" | "handle"
                    > & {
                      featuredImage?: StorefrontTypes.Maybe<
                        Pick<StorefrontTypes.Image, "url" | "altText">
                      >;
                    };
                  };
                });
          }>;
        };
      }
    >;
    userErrors: Array<Pick<StorefrontTypes.CartUserError, "field" | "message">>;
  }>;
};

export type GetAllProductsQueryVariables = StorefrontTypes.Exact<{
  [key: string]: never;
}>;

export type GetAllProductsQuery = {
  products: {
    edges: Array<{
      node: Pick<
        StorefrontTypes.Product,
        | "id"
        | "title"
        | "handle"
        | "productType"
        | "vendor"
        | "publishedAt"
        | "availableForSale"
        | "description"
      > & {
        images: {
          edges: Array<{
            node: Pick<StorefrontTypes.Image, "id" | "src" | "altText">;
          }>;
        };
        variants: {
          edges: Array<{
            node: Pick<StorefrontTypes.ProductVariant, "id" | "title"> & {
              price: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontTypes.Maybe<
                Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">
              >;
            };
          }>;
        };
      };
    }>;
  };
};

export type GetProductByHandleQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars["String"]["input"];
}>;

export type GetProductByHandleQuery = {
  productByHandle?: StorefrontTypes.Maybe<
    Pick<
      StorefrontTypes.Product,
      | "id"
      | "title"
      | "handle"
      | "productType"
      | "vendor"
      | "publishedAt"
      | "availableForSale"
      | "description"
    > & {
      images: {
        edges: Array<{
          node: Pick<
            StorefrontTypes.Image,
            "id" | "src" | "altText" | "width" | "height"
          >;
        }>;
      };
      variants: {
        edges: Array<{
          node: Pick<StorefrontTypes.ProductVariant, "id" | "title"> & {
            price: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
            compareAtPrice?: StorefrontTypes.Maybe<
              Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">
            >;
          };
        }>;
      };
    }
  >;
};

interface GeneratedQueryTypes {
  "\n  #graphql\n  query GetAllProducts {\n    products(first: 50) {\n      edges {\n        node {\n          id\n          title\n          handle\n          productType\n          vendor\n          publishedAt\n          availableForSale\n          description\n          images(first: 1) {\n            edges {\n              node {\n                id\n                src\n                altText\n              }\n            }\n          }\n          variants(first: 10) {\n            edges {\n              node {\n                id\n                title\n                price {\n                  amount\n                  currencyCode\n                }\n                compareAtPrice {\n                  amount\n                  currencyCode\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: GetAllProductsQuery;
    variables: GetAllProductsQueryVariables;
  };
  "\n  #graphql\n  query GetProductByHandle($handle: String!) {\n    productByHandle(handle: $handle) {\n      id\n      title\n      handle\n      productType\n      vendor\n      publishedAt\n      availableForSale\n      description\n      images(first: 1) {\n        edges {\n          node {\n            id\n            src\n            altText\n            width\n            height\n          }\n        }\n      }\n      variants(first: 10) {\n        edges {\n          node {\n            id\n            title\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: GetProductByHandleQuery;
    variables: GetProductByHandleQueryVariables;
  };
}

interface GeneratedMutationTypes {
  "\n  #graphql\n  mutation CartCreate($input: CartInput!) {\n    cartCreate(input: $input) {\n      cart {\n        id\n        checkoutUrl\n        totalQuantity\n        cost {\n          totalAmount {\n            amount\n            currencyCode\n          }\n          subtotalAmount {\n            amount\n            currencyCode\n          }\n          totalTaxAmount {\n            amount\n            currencyCode\n          }\n        }\n        createdAt\n        updatedAt\n        lines(first: 10){\n          edges {\n            node {\n              id\n              quantity\n              cost {\n                totalAmount {\n                  amount\n                  currencyCode\n                }\n              }\n              merchandise {\n                ... on ProductVariant {\n                  id\n                  title\n                  price {\n                    amount\n                    currencyCode\n                  }\n                  compareAtPrice {\n                    amount\n                    currencyCode\n                  }\n                  product {\n                    id\n                    title\n                    handle\n                    featuredImage {\n                      url\n                      altText\n                    }\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {
    return: CartCreateMutation;
    variables: CartCreateMutationVariables;
  };
}
declare module "@shopify/storefront-api-client" {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
