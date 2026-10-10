// PLACEHOLDER bank details for bank transfer payments.
// TODO: replace every value below with the real Al Adeel Furniture bank account
// details before accepting real bank transfer orders.
export const BANK_DETAILS = {
  bankName: "Emirates NBD (placeholder)",
  accountName: "Al Adeel Furniture (placeholder)",
  accountNumber: "0000 0000 0000 000",
  iban: "AE00 0000 0000 0000 0000 000",
  swift: "XXXXAEAD",
} as const;

/** Bank transfer stays hidden until real account details are added above. */
export const BANK_TRANSFER_ENABLED = false;
