export const phoneRegex = /^[0-9+\-()\s]{7,20}$/; // flexible, supports +91 etc.
export const pincodeRegex = /^[1-9][0-9]{5}$/; // India PIN: 6 digits, cannot start with 0
export const gstinRegex =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/; // standard GSTIN format
