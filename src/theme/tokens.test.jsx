import {describe,it,expect,beforeEach,vi} from 'vitest';
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {primaryTones,light,dark,THEME_KEY,readPreference,persistPreference,resolveMode} from './tokens';
import {UIProvider,ThemeSettings,ThemeToggle,makeTheme} from '../ui';
const expectedTones={0:'#000000',10:'#00174b',20:'#002a78',30:'#003ea8',40:'#2055cd',50:'#4270e7',60:'#618bff',70:'#8ca8ff',80:'#b4c5ff',90:'#dbe1ff',95:'#eef0ff',99:'#fefbff',100:'#ffffff'};
const expectedLight={primary:'#2055cd',onPrimary:'#ffffff',primaryContainer:'#dbe1ff',onPrimaryContainer:'#00174b',secondary:'#585e72',onSecondary:'#ffffff',secondaryContainer:'#dde1f9',onSecondaryContainer:'#151b2d',tertiary:'#745471',surface:'#fefbff',onSurface:'#1a1b21',surfaceVariant:'#e2e2ec',onSurfaceVariant:'#45464f',outline:'#757680',outlineVariant:'#c5c6d0',background:'#fefbff',error:'#ba191a'};
const expectedDark={primary:'#b4c5ff',onPrimary:'#002a78',primaryContainer:'#003ea8',onPrimaryContainer:'#dbe1ff',secondary:'#c1c5dd',onSecondary:'#2a3042',secondaryContainer:'#414659',onSecondaryContainer:'#dde1f9',tertiary:'#e2bbdb',surface:'#1a1b21',onSurface:'#e3e2e9',surfaceVariant:'#45464f',onSurfaceVariant:'#c5c6d0',outline:'#8f909a',outlineVariant:'#45464f',background:'#1a1b21',error:'#ffb4ab'};
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
beforeEach(()=>{cleanup();localStorage.clear();vi.unstubAllGlobals();});
describe('Material 3 source palette',()=>{
it('matches every approved tonal step',()=>expect(primaryTones).toEqual(expectedTones));
it('matches every approved light and dark semantic role',()=>{expect(light).toMatchObject(expectedLight);expect(dark).toMatchObject(expectedDark);expect(Object.isFrozen(light)).toBe(true);});
for(const [mode,c] of Object.entries({light,dark})){it(mode+' maps MUI to the same semantic source',()=>{const t=makeTheme(mode);expect(t.palette.mode).toBe(mode);expect(t.palette.primary.main).toBe(c.primary);expect(t.palette.primary.contrastText).toBe(c.onPrimary);expect(t.palette.background.paper).toBe(c.surface);expect(t.palette.text.secondary).toBe(c.onSurfaceVariant);expect(t.palette.divider).toBe(c.outlineVariant);});for(const [fg,bg] of [['primary','surface'],['onPrimary','primary'],['onSurface','surface'],['onPrimaryContainer','primaryContainer']])it(mode+' AA '+fg+'/'+bg,()=>expect(contrast(c[fg],c[bg])).toBeGreaterThanOrEqual(4.5));}
});
describe('theme preference',()=>{
it('defaults to the operating system only without an explicit choice',()=>{expect(readPreference(localStorage)).toBe('system');expect(resolveMode('system',true)).toBe('dark');expect(resolveMode('system',false)).toBe('light');expect(resolveMode('light',true)).toBe('light');expect(resolveMode('dark',false)).toBe('dark');});
it('persists and clears explicit choices without touching workspace data',()=>{localStorage.setItem('projects','preserved');persistPreference(localStorage,'dark');expect(readPreference(localStorage)).toBe('dark');persistPreference(localStorage,'light');expect(localStorage.getItem(THEME_KEY)).toBe('light');persistPreference(localStorage,'system');expect(localStorage.getItem(THEME_KEY)).toBeNull();expect(localStorage.getItem('projects')).toBe('preserved');});
it('handles invalid and inaccessible storage',()=>{localStorage.setItem(THEME_KEY,'invalid');expect(readPreference(localStorage)).toBe('system');const broken={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};expect(readPreference(broken)).toBe('system');expect(()=>persistPreference(broken,'dark')).not.toThrow();});
it('applies first-visit system preference and toggles persistently across remount',()=>{vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}));let r=render(<UIProvider><ThemeToggle/><ThemeSettings/></UIProvider>);expect(document.documentElement.dataset.theme).toBe('dark');fireEvent.click(screen.getByRole('button',{name:'Switch to light theme'}));expect(localStorage.getItem(THEME_KEY)).toBe('light');r.unmount();r=render(<UIProvider><ThemeToggle/><ThemeSettings/></UIProvider>);expect(document.documentElement.dataset.theme).toBe('light');fireEvent.change(screen.getByLabelText('Color theme'),{target:{value:'system'}});expect(document.documentElement.dataset.theme).toBe('dark');expect(localStorage.getItem(THEME_KEY)).toBeNull();r.unmount();});
it('tracks system changes only while following system',()=>{let change;vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:(n,fn)=>{change=fn;},removeEventListener:vi.fn()}));const r=render(<UIProvider><ThemeSettings/></UIProvider>);fireEvent.change(screen.getByLabelText('Color theme'),{target:{value:'dark'}});expect(document.documentElement.dataset.theme).toBe('dark');fireEvent.change(screen.getByLabelText('Color theme'),{target:{value:'system'}});expect(document.documentElement.dataset.theme).toBe('light');r.unmount();});
});

// Opaque black is permitted in tonal data/foregrounds, never in screen surfaces.
function isOpaqueBlack(value){
 const v=value.toLowerCase().replace(/\s+/g,'');
 return /^(?:black|#000|#000000|#000f|#000000ff|rgb\(0,0,0\)|rgba\(0,0,0,1(?:\.0+)?\)|rgb\(000(?:\/1)?\))$/.test(v);
}
describe('non-black semantic surfaces and tonal elevation',()=>{
 for(const [mode,c] of Object.entries({light,dark})){
  it(mode+' has no opaque black background or container semantic tokens',()=>{
   const surfaces=Object.entries(c).filter(([name])=>/^(?:surface|background)|Container$|Hover$|^(?:primary|secondary|tertiary|error|success|warning|info|hover|scrim)$/.test(name)&&!name.startsWith('on'));
   expect(surfaces.length).toBeGreaterThan(10);
   for(const [name,value] of surfaces){expect(isOpaqueBlack(value),name+' must not be an opaque black surface').toBe(false);}
   for(const value of Object.values(makeTheme(mode).palette.background))expect(isOpaqueBlack(value)).toBe(false);
  });
  it(mode+' maps all 25 Paper elevations to explicit surface tones without MUI overlays',()=>{
   const t=makeTheme(mode),paper=t.components.MuiPaper.styleOverrides.root;
   for(let elevation=0;elevation<=24;elevation++){
    const expected=elevation===0?c.surface:elevation===1?c.surfaceContainerLow:elevation<=3?c.surfaceContainer:elevation<=7?c.surfaceContainerHigh:c.surfaceContainerHighest;
    expect(paper({ownerState:{elevation}})).toMatchObject({backgroundColor:expected,backgroundImage:'none'});
   }
   expect(paper({ownerState:{variant:'outlined',elevation:12}}).backgroundColor).toBe(c.surface);
  });
  it(mode+' maps dialogs, menus, popovers, snackbars and chrome to the ramp',()=>{
   const {components}=makeTheme(mode);
   for(const name of ['MuiDialog','MuiMenu','MuiPopover'])expect(components[name].styleOverrides.paper).toMatchObject({backgroundColor:c.surfaceContainerHigh,backgroundImage:'none',color:c.onSurface});
   expect(components.MuiSnackbarContent.styleOverrides.root).toMatchObject({backgroundColor:c.surfaceContainerHighest,color:c.onSurface});
   expect(components.MuiDrawer.styleOverrides.paper.backgroundColor).toBe(c.surfaceContainerLow);
   expect(components.MuiAppBar.styleOverrides.root.backgroundColor).toBe(c.surfaceContainerLow);
  });
 }
 const ramp=['surface','surfaceContainerLow','surfaceContainer','surfaceContainerHigh','surfaceContainerHighest'];
 for(const key of ramp)it('dark onSurface maintains AA against '+key,()=>expect(contrast(dark.onSurface,dark[key])).toBeGreaterThanOrEqual(4.5));
 it('dark elevation becomes progressively lighter',()=>{for(let i=1;i<ramp.length;i++)expect(luminance(dark[ramp[i]])).toBeGreaterThan(luminance(dark[ramp[i-1]]));});
 it('detects all supported opaque black notations without rejecting scrims',()=>{
  for(const color of ['black','#000','#000000','rgb(0, 0, 0)','rgba(0,0,0,1)','#000f','#000000ff'])expect(isOpaqueBlack(color)).toBe(true);
  for(const color of ['#00000099','rgba(0,0,0,0.5)','#1a1b21'])expect(isOpaqueBlack(color)).toBe(false);
 });
});
