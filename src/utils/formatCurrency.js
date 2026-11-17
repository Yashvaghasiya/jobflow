export const formatCurrency = (value=0,options={}) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0,...options}).format(Number(value)||0);
export default formatCurrency;
