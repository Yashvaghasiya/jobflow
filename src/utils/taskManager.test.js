import {beforeEach,describe,expect,it,vi} from 'vitest';
import {createProject,createTask,completeTask,orderedTasks,taskProgress,filterProjects,search,assignWorker,createReminder,completeReminder} from './taskManager';
import {workerPayment,purchasePayment,clientPending,dashboardTotals,paymentStatus,pending} from './calculations';
import {initialize,save,get,getProjects,saveProjects,getTasks,saveTasks,getPeople,savePeople,getPurchases,savePurchases,getReminders,saveReminders} from './storage';
import {formatCurrency} from './formatCurrency';
import seed from '../data/seedData';
const project=()=>createProject({name:'Office Signage',clientName:'Client A',projectValue:250000,clientAmountReceived:175000});
const task=(extra={},list=[])=>createTask({name:'Cut panels',projectId:'p1',jobCost:8000,amountPaid:3000,...extra},list);
beforeEach(()=>{localStorage.clear();vi.useRealTimers();});
describe('project lifecycle and discovery',()=>{
it('creates a project with enquiry default, identifiers and timestamps',()=>{const p=project();expect(p).toMatchObject({name:'Office Signage',clientName:'Client A',status:'Enquiry'});expect(p.id).toBeTruthy();expect(p.createdAt).toBeTruthy();expect(p.updatedAt).toBeTruthy();});
it('requires a project and client name',()=>{expect(()=>createProject({name:' ',clientName:'A'})).toThrow();expect(()=>createProject({name:'A'})).toThrow();});
it('records completion date while preserving financial data',()=>{const p=createProject({...project(),status:'Completed'});expect(p.completedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(p.projectValue).toBe(250000);});
it('filters projects by exact status',()=>{const list=[{...project(),status:'In Progress'},{...project(),status:'Pending'}];expect(filterProjects(list,'Pending')).toHaveLength(1);expect(filterProjects(list,'All')).toHaveLength(2);});
it('searches project names and client names without case sensitivity',()=>{const list=[project(),{...project(),name:'Cafe',clientName:'Brew'}];expect(filterProjects(list,'All','CLIENT A')).toHaveLength(1);expect(search(list,'cafe')[0].clientName).toBe('Brew');});
it('calculates dashboard totals dynamically',()=>{expect(dashboardTotals([{status:'Enquiry'},{status:'In Progress'},{status:'Completed'},{status:'Pending'},{status:'Cancelled'}])).toEqual({'Total Projects':5,Enquiry:1,'In Progress':1,Pending:1,Completed:1});expect(dashboardTotals([])['Total Projects']).toBe(0);});
});
describe('ordered sequential task management',()=>{
it('creates tasks with calculated pending amounts',()=>{const t=task();expect(t).toMatchObject({name:'Cut panels',jobCost:8000,amountPaid:3000,amountPending:5000,order:1,status:'In Progress'});expect(t.id).toBeTruthy();expect(()=>task({name:''})).toThrow();});
it('assigns subsequent task order without changing existing tasks',()=>{const first=task({order:9});const next=task({},[first]);expect(next.order).toBe(first.order+1);expect(next.status).toBe('Pending');});
it('orders tasks by order rather than array position',()=>{const tasks=[{order:3},{order:1},{order:2}];expect(orderedTasks(tasks).map(t=>t.order)).toEqual([1,2,3]);expect(tasks[0].order).toBe(3);});
it('records task completion and date without mutating the input',()=>{const t=task(),list=[t];const result=completeTask(list,t.id);expect(result[0].status).toBe('Completed');expect(result[0].completedDate).toBeTruthy();expect(t.status).toBe('In Progress');});
it('activates only the next pending task in the same project',()=>{const a=task(),b=task({name:'Assembly'},[a]),c=task({name:'Install'},[a,b]);const other=task({projectId:'p2',status:'Pending'});const result=completeTask([c,b,a,other],a.id);expect(result.find(t=>t.id===b.id).status).toBe('In Progress');expect(result.find(t=>t.id===c.id).status).toBe('Pending');expect(result.find(t=>t.id===other.id).status).toBe('Pending');});
it('does not activate another task when a manual current task exists',()=>{const a=task(),b=task({status:'In Progress'},[a]),c=task({},[a,b]);expect(completeTask([a,b,c],a.id).find(t=>t.id===c.id).status).toBe('Pending');});
it('handles completing the final task and an unknown identifier',()=>{const a=task();expect(completeTask([a],a.id)[0].status).toBe('Completed');expect(completeTask([a],'missing')).toEqual([a]);});
it('calculates progress, including empty task sets',()=>{expect(taskProgress([{status:'Completed'},{status:'Pending'},{status:'Completed'}])).toEqual({completed:2,total:3,percent:67});expect(taskProgress([])).toEqual({completed:0,total:0,percent:0});});
it('assigns a worker immutably',()=>{const t=task(),assigned=assignWorker(t,'rahul');expect(assigned.assignedPersonId).toBe('rahul');expect(t.assignedPersonId).toBeUndefined();});
});
describe('payment arithmetic',()=>{
it('calculates worker payment totals',()=>{expect(workerPayment([{jobCost:8000,amountPaid:3000},{jobCost:6500,amountPaid:1500}])).toEqual({total:14500,paid:4500,pending:10000});});
it('calculates purchase payment pending',()=>expect(purchasePayment({totalAmount:28000,amountPaid:18000})).toBe(10000));
it('calculates client pending from project value and received amount',()=>expect(clientPending(project())).toBe(75000));
it('never accepts overpayments or negative payments',()=>{expect(()=>pending(100,101)).toThrow();expect(()=>pending(-1,0)).toThrow();expect(()=>pending(100,-1)).toThrow();expect(()=>task({amountPaid:9000})).toThrow();expect(()=>createProject({name:'A',clientName:'B',projectValue:100,clientAmountReceived:101})).toThrow();});
it('derives payment status from amounts',()=>{expect(paymentStatus(100,0)).toBe('Pending');expect(paymentStatus(100,50)).toBe('Partially Paid');expect(paymentStatus(100,100)).toBe('Paid');});
it('formats Indian currency grouping consistently',()=>{expect(formatCurrency(10000)).toBe('₹10,000');expect(formatCurrency(125000)).toBe('₹1,25,000');expect(formatCurrency(540000)).toBe('₹5,40,000');expect(formatCurrency(1250000)).toBe('₹12,50,000');});
});
describe('reminders and persistence',()=>{
it('creates a pending reminder',()=>{const r=createReminder({title:'Payment follow-up',date:'2026-11-18',time:'10:30',projectId:'p1'});expect(r.id).toBeTruthy();expect(r.completed).toBe(false);expect(r.title).toBe('Payment follow-up');expect(()=>createReminder({title:'Missing date'})).toThrow();});
it('completes a reminder without mutating the original',()=>{const r=createReminder({title:'Call',date:'2026-11-18'});expect(completeReminder(r).completed).toBe(true);expect(r.completed).toBe(false);});
it('persists every entity in localStorage with reusable helpers',()=>{for(const [getEntity,saveEntity] of [[getProjects,saveProjects],[getTasks,saveTasks],[getPeople,savePeople],[getPurchases,savePurchases],[getReminders,saveReminders]]){saveEntity([{id:'record'}]);expect(getEntity()).toEqual([{id:'record'}]);}save('custom',{ok:true});expect(get('custom')).toEqual({ok:true});});
it('seeds once and preserves intentionally empty collections',()=>{const first=initialize(seed);expect(first.projects).toHaveLength(3);saveProjects([]);const second=initialize(seed);expect(second.projects).toEqual([]);expect(second.tasks).toHaveLength(12);});
it('handles missing and corrupt localStorage values safely',()=>{expect(get('missing')).toEqual([]);localStorage.setItem('broken','{oops');expect(get('broken')).toEqual([]);});
it('ships coherent sample task and purchase balances',()=>{const titan=seed.projects.find(p=>p.id==='titan');expect(clientPending(titan)).toBe(75000);const tasks=seed.tasks.filter(t=>t.projectId==='titan');expect(tasks).toHaveLength(10);expect(taskProgress(tasks).completed).toBe(2);expect(tasks.find(t=>t.status==='In Progress').assignedPersonId).toBe('amit');expect(workerPayment(tasks).pending).toBeGreaterThan(0);for(const t of tasks)expect(t.amountPending).toBe(pending(t.jobCost,t.amountPaid));for(const p of seed.purchases)expect(p.amountPending).toBe(purchasePayment(p));});
it('seeds future reminders and recent completed history relative to runtime today',()=>{const today=new Date().toLocaleDateString('en-CA');expect(seed.reminders.every(r=>r.date>today)).toBe(true);expect(seed.projects.filter(p=>p.status==='Completed').every(p=>p.completedDate<today)).toBe(true);});
});
