export interface ICheckoutResponse {
  checkout: {
    cartId: string;
    checkoutUrl: string;
    totalQuantity: number;
    cost: {
      totalAmount: {
        amount: string;
        currencyCode: string;
      };
      subtotalAmount: {
        amount: string;
        currencyCode: string;
      };
      totalTaxAmount: {
        amount: string;
        currencyCode: string;
      } | null;
    };
  };
}
