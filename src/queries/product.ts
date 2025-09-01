export const getProductsQuery = `
  #graphql
  query GetAllProducts {
    products(first: 50) {
      edges {
        node {
          id
          title
          handle
          productType
          vendor
          publishedAt
          availableForSale
          description
          images(first: 1) {
            edges {
              node {
                id
                src
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const getProductByHandleQuery = `
  #graphql
  query GetProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      productType
      vendor
      publishedAt
      availableForSale
      description
      images(first: 1) {
        edges {
          node {
            id
            src
            altText
            width
            height
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;
