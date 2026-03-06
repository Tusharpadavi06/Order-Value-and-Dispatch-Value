
export const formatIndianCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  }).format(Math.round(num)).replace('₹', '₹ ');
};

export const numberToWordsIndian = (num: number): string => {
  if (num === 0) return "Zero";
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inWords(n % 100) : "");
    return "";
  };

  let n = Math.round(num);
  let str = "";
  
  if (n >= 10000000) {
    str += inWords(Math.floor(n / 10000000)) + "Crore ";
    n %= 10000000;
  }
  if (n >= 100000) {
    str += inWords(Math.floor(n / 100000)) + "Lakh ";
    n %= 100000;
  }
  if (n >= 1000) {
    str += inWords(Math.floor(n / 1000)) + "Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    str += inWords(n);
  }

  return str.trim() + " Rupees Only";
};
