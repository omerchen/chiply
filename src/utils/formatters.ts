export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}; 