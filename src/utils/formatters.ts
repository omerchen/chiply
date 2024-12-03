import { CURRENCY_SIGN, CURRENCY_LOCALE } from "../config/constants";

export const formatMoney = (amount: number) => {
  const formattedNumber = new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `${CURRENCY_SIGN}${formattedNumber}`;
}; 