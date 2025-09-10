export const createSubscriptionContractMutation = `
  mutation subscriptionContractCreate($input: SubscriptionContractCreateInput!) {
    subscriptionContractCreate(input: $input) {
      contract {
        id
        status
        nextBillingDate
        customer {
          id
          email
        }
        lines(first: 10) {
          edges {
            node {
              id
              quantity
              currentPrice {
                amount
                currencyCode
              }
              sellingPlan {
                id
                name
                description
                recurringDeliveries
                priceAdjustments {
                  adjustmentType
                  adjustmentValue {
                    ... on SellingPlanPercentagePriceAdjustment {
                      adjustmentPercentage
                    }
                    ... on SellingPlanFixedAmountPriceAdjustment {
                      adjustmentAmount {
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
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const getSellingPlansQuery = `
  query getSellingPlans($first: Int!) {
    sellingPlanGroups(first: $first) {
      edges {
        node {
          id
          name
          sellingPlans(first: 10) {
            edges {
              node {
                id
                name
                description
                recurringDeliveries
                priceAdjustments {
                  adjustmentType
                  adjustmentValue {
                    ... on SellingPlanPercentagePriceAdjustment {
                      adjustmentPercentage
                    }
                    ... on SellingPlanFixedAmountPriceAdjustment {
                      adjustmentAmount {
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
      }
    }
  }
`;
