export const keys=['projects','tasks','people','purchases','reminders'];
export function get(key,fallback=[]){try{const value=JSON.parse(localStorage.getItem(key));return value??fallback;}catch{return fallback;}}
export function save(key,value){localStorage.setItem(key,JSON.stringify(value));return value;}
export function initialize(seed){if(!localStorage.getItem('jobflow.initialized')){keys.forEach(k=>{if(localStorage.getItem(k)===null)save(k,seed[k]||[]);});localStorage.setItem('jobflow.initialized','1');}return Object.fromEntries(keys.map(k=>[k,get(k)]));}
export const getProjects=()=>get('projects');export const saveProjects=x=>save('projects',x);
export const getTasks=()=>get('tasks');export const saveTasks=x=>save('tasks',x);
export const getPeople=()=>get('people');export const savePeople=x=>save('people',x);
export const getPurchases=()=>get('purchases');export const savePurchases=x=>save('purchases',x);
export const getReminders=()=>get('reminders');export const saveReminders=x=>save('reminders',x);
