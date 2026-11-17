export const rules=[
 ['task_due_soon','Task due soon','Open tasks due today or within the next N days.','daysBeforeDue',2,0,30],
 ['task_overdue','Overdue tasks','Open tasks whose due date has passed.'],
 ['invoice_overdue','Overdue invoices','Issued invoices with a balance, N days after issue (there is no invoice due-date field).','daysAfterIssue',15,1,90],
 ['project_pending_closure','Project close-out','All tasks complete, but the project is not complete or still has an unpaid issued invoice.']
];
export const istDay=(at=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
export const addDays=(day,n)=>new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export const balance=i=>Math.max(0,(Number(i.total)||0)-(Number(i.amountPaid)||0));
export const dueSoon=(t,day,n=2)=>t.status!=='Completed'&&!!t.dueDate&&t.dueDate>=day&&t.dueDate<=addDays(day,n);
export const overdue=(t,day)=>t.status!=='Completed'&&/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate||'')&&t.dueDate<day;
export const sourceKey=(rule,id,occurrence='')=>[rule,id,...(occurrence?[occurrence]:[])].join(':');
export const invoiceOverdue=(i,day,n=15)=>i.status!=='Draft'&&balance(i)>0&&!!i.issuedDate&&addDays(i.issuedDate,n)<day;
export const pendingClosure=(p,tasks,invoices)=>{const ts=tasks.filter(t=>t.projectId===p.id);return ts.length>0&&ts.every(t=>t.status==='Completed')&&(p.status!=='Completed'||invoices.some(i=>i.projectId===p.id&&i.status!=='Draft'&&balance(i)>0));};
