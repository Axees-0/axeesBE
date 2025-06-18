export function formatPrice(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

export function formatPriceShort(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount}`;
}

export function parsePrice(priceString: string): number {
  // Remove currency symbols and formatting
  const cleanedString = priceString.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanedString) || 0;
}

export function calculateFee(amount: number, feePercentage: number = 10): number {
  return amount * (feePercentage / 100);
}

export function calculateNetAmount(amount: number, feePercentage: number = 10): number {
  return amount - calculateFee(amount, feePercentage);
}