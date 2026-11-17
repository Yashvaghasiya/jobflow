import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {keys,connectCache,disconnectCache,save,get,initialize,localImport,snapshot} from './storage';
const empty=()=>Object.fromEntries(keys.map(k=>[k,[]]));
beforeEach(()=>{disconnectCache();localStorage.clear();});afterEach(()=>disconnectCache());
describe('cloud cache isolation and legacy migration',()=>{
it('starts a new cloud account empty without seeding samples',()=>{const data=empty();connectCache('a',data,()=>{});expect(initialize({projects:[{id:'sample'}]})).toEqual(data);});
it('preserves legacy records while saving to a scoped account',()=>{localStorage.setItem('projects',JSON.stringify([{id:'legacy'}]));connectCache('a',empty(),()=>{});save('projects',[{id:'cloud'}]);expect(get('projects')).toEqual([{id:'cloud'}]);expect(localImport().projects).toEqual([{id:'legacy'}]);});
it('keeps account caches separate',()=>{connectCache('a',empty(),()=>{});save('projects',[{id:'private-a'}]);connectCache('b',empty(),()=>{});expect(get('projects')).toEqual([]);expect(localStorage.getItem('jobflow.user.a.projects')).toContain('private-a');});
it('notifies writes only for entity collections',()=>{const fn=vi.fn();connectCache('a',empty(),fn);save('jobflow.business','Studio');expect(fn).not.toHaveBeenCalled();save('tasks',[{id:'t'}]);expect(fn).toHaveBeenCalledOnce();expect(snapshot().tasks).toEqual([{id:'t'}]);});
it('handles missing and corrupt legacy collections',()=>{localStorage.setItem('projects','invalid');expect(localImport()).toEqual(empty());});
it('restores original local mode after disconnecting',()=>{localStorage.setItem('people',JSON.stringify([{id:'legacy'}]));connectCache('a',empty(),()=>{});disconnectCache();expect(get('people')).toEqual([{id:'legacy'}]);});
});
