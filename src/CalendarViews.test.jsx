import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {act} from 'react';
import {createRoot} from 'react-dom/client';
vi.mock('./workspace',()=>({useWorkspace:()=>({data:{tasks:[],projects:[],people:[]},navigate:vi.fn(),schedule:vi.fn()})}));
import {Calendar} from './Phase8';
let host,root;
function render(node){host=document.createElement('div');document.body.append(host);root=createRoot(host);act(()=>root.render(node));}
function cleanup(){if(root){act(()=>root.unmount());host.remove();root=null;}}
const screen={getByRole:(role,{name}={})=>{const els=[...document.querySelectorAll(role==='button'?'button':'[role="'+role+'"]')];return els.find(e=>!name||(e.getAttribute('aria-label')||e.textContent)===name);},getAllByRole:role=>[...document.querySelectorAll(role==='button'?'button':'[role="'+role+'"]')],getByText:text=>[...document.querySelectorAll('*')].reverse().find(e=>e.textContent===text),getByLabelText:text=>[...document.querySelectorAll('[aria-label]')].find(e=>e.getAttribute('aria-label')===text)};
const fireEvent={click:el=>act(()=>el.click()),drop:(el,props)=>act(()=>{const e=new Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(e,'dataTransfer',{value:props.dataTransfer});el.dispatchEvent(e);})};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
import {monthDays,yearMonths,movePeriod,readView,saveView,VIEW_KEY,MonthView,YearView} from './CalendarViews';
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
describe('calendar month and year',()=>{
it('starts on Monday and includes adjacent month days',()=>{const d=monthDays('2026-11-18');expect(d[0]).toEqual({date:'2026-10-26',number:26,inMonth:false});expect(d[6].date).toBe('2026-11-01');expect(d).toHaveLength(42);expect(d[41].date).toBe('2026-12-06');expect(d.filter(x=>x.inMonth)).toHaveLength(30);});
it('keeps a minimum five rows for February and handles leap years',()=>{expect(monthDays('2021-02-01')).toHaveLength(35);expect(monthDays('2024-02-15').filter(d=>d.inMonth)).toHaveLength(29);});
it('generates all twelve months in the selected year',()=>{const m=yearMonths('2028-07-01');expect(m).toHaveLength(12);expect(m[0].date).toBe('2028-01-01');expect(m[11].date).toBe('2028-12-01');expect(m[1].days.filter(d=>d.inMonth)).toHaveLength(29);});
it('clamps month navigation and crosses year boundaries',()=>{expect(movePeriod('2026-01-31','month',1)).toBe('2026-02-28');expect(movePeriod('2024-02-29','year',1)).toBe('2025-02-28');expect(movePeriod('2026-12-18','month',1)).toBe('2027-01-18');expect(movePeriod('2026-11-18','week',-1)).toBe('2026-11-11');expect(movePeriod('2026-11-18','day',1)).toBe('2026-11-19');});
it('persists only valid views with month as the default',()=>{expect(readView()).toBe('month');for(const v of ['day','week','month','year']){saveView(v);expect(readView()).toBe(v);}localStorage.setItem(VIEW_KEY,'invalid');expect(readView()).toBe('month');});
it('survives unavailable browser storage',()=>{vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('denied');});vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('denied');});expect(readView()).toBe('month');expect(()=>saveView('year')).not.toThrow();});
it('routes a month drop through the existing scheduling callback',()=>{const task={id:'t1',name:'Print',status:'Pending'},schedule=vi.fn((t,date)=>{t.scheduled_date=date;});render(<MonthView day="2026-11-18" tasks={[task]} today="2026-11-18" onSchedule={schedule} card={t=><div key={t.id}>{t.name}</div>}/>);fireEvent.drop(screen.getByRole('gridcell',{name:'2026-11-20, 0 tasks'}),{dataTransfer:{getData:()=>task.id}});expect(schedule).toHaveBeenCalledWith(task,'2026-11-20');expect(task.scheduled_date).toBe('2026-11-20');});
it('shows task overflow and opens the complete day list',()=>{const tasks=Array.from({length:6},(_,i)=>({id:String(i),name:'Task '+i,scheduled_date:'2026-11-18'}));render(<MonthView day="2026-11-18" tasks={tasks} today="2026-11-18" onSchedule={vi.fn()} card={t=><div key={t.id}>{t.name}</div>}/>);expect(screen.getByRole('gridcell',{name:'2026-11-18 Today, 6 tasks'})).toBeTruthy();fireEvent.click(screen.getByText('+3 more'));expect(screen.getByRole('dialog')).toBeTruthy();expect(screen.getByText('Task 5')).toBeTruthy();});
it('shows twelve mini-months with density and drills into a month',()=>{const open=vi.fn();render(<YearView day="2026-11-18" today="2026-11-18" tasks={[{scheduled_date:'2026-11-18'}]} onMonth={open}/>);expect(screen.getAllByRole('button')).toHaveLength(12);expect(screen.getByLabelText('2026-11-18: 1 tasks')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Open November 2026'}));expect(open).toHaveBeenCalledWith('2026-11-01');});
});

describe('calendar view preference lifecycle',()=>{
it('opens the current month without saving an implicit preference',()=>{render(<Calendar/>);expect(screen.getByRole('button',{name:'Month'}).getAttribute('aria-pressed')).toBe('true');expect(document.querySelector('[role="grid"]')).toBeTruthy();expect(localStorage.getItem(VIEW_KEY)).toBeNull();});
it('persists an explicit Week choice across remounts and resets to Month when cleared',()=>{render(<Calendar/>);fireEvent.click(screen.getByRole('button',{name:'Week'}));expect(localStorage.getItem(VIEW_KEY)).toBe('week');cleanup();render(<Calendar/>);expect(screen.getByRole('button',{name:'Week'}).getAttribute('aria-pressed')).toBe('true');cleanup();localStorage.removeItem(VIEW_KEY);render(<Calendar/>);expect(screen.getByRole('button',{name:'Month'}).getAttribute('aria-pressed')).toBe('true');expect(localStorage.getItem(VIEW_KEY)).toBeNull();});
it.each(['day','week','month','year'])('keeps a returning user saved %s choice',view=>{localStorage.setItem(VIEW_KEY,view);render(<Calendar/>);expect(screen.getByRole('button',{name:view[0].toUpperCase()+view.slice(1)}).getAttribute('aria-pressed')).toBe('true');expect(localStorage.getItem(VIEW_KEY)).toBe(view);});
});
