const amountInWords = (amount) => {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  const convert = (n) => {
    if (n < 20)   return ones[n];
    if (n < 100)  return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + convert(n%100) : '');
    if (n < 1e6)  return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + convert(n%1000) : '');
    return convert(Math.floor(n/1e6)) + ' Million' + (n%1e6 ? ' ' + convert(n%1e6) : '');
  };

  return convert(amount) + ' Rwandan Francs Only';
};

const fmt = (n) => 'RWF ' + Number(n).toLocaleString();

const sendSuccess = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

const sendError = (res, message = 'Server error', status = 500) =>
  res.status(status).json({ success: false, message });

module.exports = { amountInWords, fmt, sendSuccess, sendError };
