import {pending,taskProgress} from './calculations';
export {taskProgress};
export const id=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
export const now=()=>new Date().toISOString();
export function createProject(data){if(!data.name?.trim()||!data.clientName?.trim())throw new Error('Project and client names are required');pending(data.projectValue,data.clientAmountReceived);return {id:id(),projectValue:0,clientAmountReceived:0,status:'Enquiry',createdAt:now(),...data,updatedAt:now(),...(data.status==='Completed'?{completedDate:now().slice(0,10)}:{})};}
export const orderedTasks=tasks=>[...tasks].sort((a,b)=>a.order-b.order);
export function createTask(data,tasks=[]){if(!data.name?.trim())throw new Error('Task name is required');return {id:id(),status:tasks.some(t=>t.status!=='Completed')?'Pending':'In Progress',priority:'Medium',...data,order:Math.max(0,...tasks.map(t=>t.order||0))+1,amountPending:pending(data.jobCost,data.amountPaid)};}
export function completeTask(tasks,taskId){let result=tasks.map(t=>t.id===taskId?{...t,status:'Completed',completedDate:now().slice(0,10)}:{...t});let done=result.find(t=>t.id===taskId);if(!done)return result;let next=orderedTasks(result.filter(t=>t.projectId===done.projectId&&t.status==='Pending')).find(t=>t.order>done.order);if(next&&!result.some(t=>t.projectId===done.projectId&&t.status==='In Progress'))next.status='In Progress';return result;}
export const filterProjects=(projects,status='All',query='')=>projects.filter(p=>(status==='All'||p.status===status)&&(p.name+' '+p.clientName).toLowerCase().includes(query.toLowerCase()));
export const search=(items,query)=>items.filter(x=>Object.values(x).join(' ').toLowerCase().includes(query.toLowerCase()));
export const assignWorker=(task,personId)=>({...task,assignedPersonId:personId});
export function createReminder(data){if(!data.title?.trim()||!data.date)throw new Error('Title and date are required');return {id:id(),completed:false,priority:'Medium',...data};}
export const completeReminder=r=>({...r,completed:true});
