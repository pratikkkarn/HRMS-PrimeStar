import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} k`;
  }
  return formatINR(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getDaysRemaining(expiryDate: string): number {
  if (!expiryDate) return 999;
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function numberToWordsINR(num: number): string {
  if (isNaN(num) || num <= 0) return 'Indian Rupees Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return units[n];
    const t = tens[Math.floor(n / 10)];
    const u = units[n % 10];
    return u ? `${t} ${u}` : t;
  };

  const convertThreeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${units[hundred]} Hundred`;
    }
    if (rest > 0) {
      const restWords = convertTwoDigits(rest);
      res = res ? `${res} ${restWords}` : restWords;
    }
    return res;
  };

  const absoluteNum = Math.abs(num);
  let integerPart = Math.floor(absoluteNum);
  const decimalPart = Math.round((absoluteNum - integerPart) * 100);
  let words = '';

  const crore = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;

  const lakh = Math.floor(integerPart / 100000);
  integerPart %= 100000;

  const thousand = Math.floor(integerPart / 1000);
  integerPart %= 1000;

  const hundred = integerPart;

  if (crore > 0) {
    words += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (hundred > 0) {
    words += `${convertThreeDigits(hundred)} `;
  }

  const finalStr = words.trim();
  let result = finalStr ? `Indian Rupees ${finalStr}` : 'Indian Rupees Zero';

  if (decimalPart > 0) {
    const paiseStr = convertTwoDigits(decimalPart);
    result = finalStr
      ? `${result} And ${paiseStr} Paise Only`
      : `Indian Rupees ${paiseStr} Paise Only`;
  } else {
    result = `${result} Only`;
  }

  return result;
}
