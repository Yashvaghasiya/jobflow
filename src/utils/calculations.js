export const sum = (items,key) => items.reduce((n,x)=>n+(Number(x[key])||0),0);
export function pending(total,paid){total=Number(total)||0;paid=Number(paid)||0;if(total<0||paid<0||paid>total)throw new Error('Paid amount must be between zero and total');return total-paid;}
export const paymentStatus=(total,paid)=>pending(total,paid)===0?'Paid':Number(paid)>0?'Partially Paid':'Pending';
export const taskProgress=tasks=>({completed:tasks.filter(t=>t.status==='Completed').length,total:tasks.length,percent:tasks.length?Math.round(tasks.filter(t=>t.status==='Completed').length/tasks.length*100):0});
export const workerPayment=tasks=>({total:sum(tasks,'jobCost'),paid:sum(tasks,'amountPaid'),pending:sum(tasks,'jobCost')-sum(tasks,'amountPaid')});
export const purchasePayment=p=>pending(p.totalAmount,p.amountPaid);
export const clientPending=p=>pending(p.projectValue,p.clientAmountReceived);
export const dashboardTotals=projects=>Object.fromEntries(['Total Projects','Enquiry','In Progress','Pending','Completed'].map(s=>[s,s==='Total Projects'?projects.length:projects.filter(p=>p.status===s).length]));
