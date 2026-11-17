import {describe,it,expect} from 'vitest';
import {dueSoon,overdue,sourceKey,invoiceOverdue,pendingClosure} from './automations';
describe('automation conditions',()=>{
 const day='2026-11-17',t={id:'t',status:'Pending',dueDate:'2026-11-19'};
 it('includes exact threshold',()=>{expect(dueSoon(t,day,2)).toBe(true);expect(dueSoon(t,day,1)).toBe(false);});
 it('includes today but not completed or past-due tasks',()=>{expect(dueSoon({...t,dueDate:day},day,0)).toBe(true);expect(dueSoon({...t,status:'Completed'},day)).toBe(false);expect(dueSoon({...t,dueDate:'2026-11-16'},day)).toBe(false);});
 it('overdue is strictly before today and open',()=>{expect(overdue({...t,dueDate:'2026-11-16'},day)).toBe(true);expect(overdue({...t,dueDate:day},day)).toBe(false);expect(overdue({...t,status:'Completed',dueDate:'2026-11-16'},day)).toBe(false);expect(overdue({status:'Pending'},day)).toBe(false);});
 it('keys are stable and change with rule/entity/occurrence',()=>{const k=sourceKey('task_overdue','t','2026-11-16');expect(k).toBe('task_overdue:t:2026-11-16');expect(sourceKey('task_overdue','t','2026-11-16')).toBe(k);expect(sourceKey('task_due_soon','t','2026-11-16')).not.toBe(k);expect(sourceKey('task_overdue','u','2026-11-16')).not.toBe(k);expect(sourceKey('task_overdue','t','2026-11-15')).not.toBe(k);expect([k].includes(k)).toBe(true);});
 it('invoice grace period, drafts and fully-paid invoices',()=>{const i={status:'Issued',issuedDate:'2026-11-01',total:100,amountPaid:0};expect(invoiceOverdue(i,'2026-11-16')).toBe(false);expect(invoiceOverdue(i,day)).toBe(true);expect(invoiceOverdue({...i,status:'Draft'},day)).toBe(false);expect(invoiceOverdue({...i,amountPaid:100},day)).toBe(false);});
 it('close-out requires nonempty complete tasks and open status or balance',()=>{const p={id:'p',status:'Completed'},ts=[{projectId:'p',status:'Completed'}];expect(pendingClosure(p,[],[])).toBe(false);expect(pendingClosure(p,ts,[])).toBe(false);expect(pendingClosure({...p,status:'In Progress'},ts,[])).toBe(true);expect(pendingClosure(p,ts,[{projectId:'p',status:'Issued',total:1}])).toBe(true);});
});
