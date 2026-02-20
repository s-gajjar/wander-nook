export type InvoiceCompanyProfile = {
  companyName: string;
  tradeName: string;
  addressLines: string[];
  email: string;
  phone: string;
  gstNumber: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  bankAccountType: string;
  bankIfsc: string;
};

function splitLines(value: string | null | undefined) {
  return (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getInvoiceCompanyProfile(): InvoiceCompanyProfile {
  const envAddressLines = splitLines(process.env.INVOICE_COMPANY_ADDRESS_LINES);

  return {
    companyName: (process.env.INVOICE_COMPANY_NAME || "Wander Stamps").trim(),
    tradeName: (process.env.INVOICE_TRADE_NAME || "Wander Stamps").trim(),
    addressLines:
      envAddressLines.length > 0
        ? envAddressLines
        : [
            "2nd Floor, New Building",
            "Shastri Hall, Nana Chowk",
            "Grant Road (W), Mumbai 400007",
          ],
    email: (process.env.INVOICE_COMPANY_EMAIL || "support@wondernook.in").trim(),
    phone: (process.env.INVOICE_COMPANY_PHONE || "+91 98200 67074").trim(),
    gstNumber: (process.env.INVOICE_GST_NUMBER || "27FQTPS4280J2ZU").trim(),
    bankName: (process.env.INVOICE_BANK_NAME || "ICICI Bank").trim(),
    bankBranch: (process.env.INVOICE_BANK_BRANCH || "Nana Chowk").trim(),
    bankAccountNumber: (process.env.INVOICE_BANK_ACCOUNT_NUMBER || "121605000810").trim(),
    bankAccountType: (process.env.INVOICE_BANK_ACCOUNT_TYPE || "Current").trim(),
    bankIfsc: (process.env.INVOICE_BANK_IFSC || "ICIC0001216").trim(),
  };
}
