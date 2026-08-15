/**
 * Format price to 2 decimal places
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '0.00';
  const num = Number(price);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

/**
 * Format price with Indian number formatting (commas)
 */
export const formatPriceINR = (price) => {
  const formatted = formatPrice(price);
  const [intPart, decPart] = formatted.split('.');
  const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${intWithCommas}.${decPart}`;
};

/**
 * Format price as whole number if no decimals, otherwise 2 decimals
 */
export const formatPriceSmart = (price) => {
  if (price === undefined || price === null) return '0';
  const num = Number(price);
  if (isNaN(num)) return '0';
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
};