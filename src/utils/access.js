export const validToken=t=>typeof t==='string'&&/^[0-9a-f]{64}$/.test(t);
export function newToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function hashToken(token){if(!validToken(token))throw Error('Invalid share token');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');}
const pick=(x,keys)=>Object.fromEntries(keys.map(k=>[k,x[k]]));
export function portalFields(p){if(!p)return null;return {name:p.name,tasks:(p.tasks||[]).map(t=>pick(t,['sequence','name','status'])),invoices:(p.invoices||[]).filter(i=>['Issued','Partially Paid','Paid'].includes(i.status)).map(i=>pick(i,['number','date','status','total','paid','vpa','payee']))};}
export const canComplete=(role,person,task)=>role==='worker'&&!!person&&task.assignedPersonId===person&&task.status==='In Progress';
