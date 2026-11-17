export const keys=['projects','tasks','people','purchases','reminders'];
let scope='',initial=null,onSave=null;
export function connectCache(userId,data,handler){scope='jobflow.user.'+userId+'.';initial=data;onSave=handler;keys.forEach(k=>localStorage.setItem(scope+k,JSON.stringify(data[k])));}
export function disconnectCache(){scope='';initial=null;onSave=null;}
export function get(key,fallback=[]){try{return JSON.parse(localStorage.getItem(scope+key))??fallback;}catch{return fallback;}}
export function save(key,value){localStorage.setItem(scope+key,JSON.stringify(value));if(onSave&&keys.includes(key))onSave();return value;}
export function initialize(seed){if(initial)return initial;if(!localStorage.getItem('jobflow.initialized')){keys.forEach(k=>{if(localStorage.getItem(k)===null)save(k,seed[k]||[]);});localStorage.setItem('jobflow.initialized','1');}return Object.fromEntries(keys.map(k=>[k,get(k)]));}
export function localImport(){return Object.fromEntries(keys.map(k=>{try{return [k,JSON.parse(localStorage.getItem(k))||[]];}catch{return [k,[]];}}));}
export const snapshot=()=>Object.fromEntries(keys.map(k=>[k,get(k)]));
export const getProjects=()=>get('projects');export const saveProjects=x=>save('projects',x);
export const getTasks=()=>get('tasks');export const saveTasks=x=>save('tasks',x);
export const getPeople=()=>get('people');export const savePeople=x=>save('people',x);
export const getPurchases=()=>get('purchases');export const savePurchases=x=>save('purchases',x);
export const getReminders=()=>get('reminders');export const saveReminders=x=>save('reminders',x);
