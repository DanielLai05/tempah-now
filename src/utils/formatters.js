// Price formatter utility
export const formatPrice = (price) => {
  return `RM ${parseFloat(price).toFixed(2)}`;
};

// Format price without RM prefix (for calculations)
export const formatPriceNumber = (price) => {
  return parseFloat(price).toFixed(2);
};

