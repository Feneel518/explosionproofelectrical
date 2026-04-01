import { Customer } from "@prisma/client";

export function cleanAddressPart(value?: string | null) {
  if (!value) return null;

  return value
    .trim()
    .replace(/,+$/g, "") // remove trailing commas
    .replace(/\s+/g, " "); // normalize spaces
}

export function buildAddressLines(
  customerDetails: Partial<Customer> & {
    clientName?: string;
  },
) {
  const line1 = cleanAddressPart(customerDetails.addressLine1);
  const line2 = cleanAddressPart(customerDetails.addressLine2);

  const city = cleanAddressPart(customerDetails.city);
  const state = cleanAddressPart(customerDetails.state);
  const country = cleanAddressPart(customerDetails.country);

  const locationLine = [city, state, country].filter(Boolean).join(", ");

  const pincode = cleanAddressPart(customerDetails.pincode);
  const gstin = cleanAddressPart(customerDetails.gstin);

  return [line1, line2, locationLine, pincode, gstin].filter(Boolean);
}
