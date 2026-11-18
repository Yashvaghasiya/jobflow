import {UIProvider} from './ui';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import {OfflineGuard} from './Phase3';import AccessGate from './Access';import React from 'react';import {createRoot} from 'react-dom/client';import CloudApp from './CloudApp';import './styles.css';createRoot(document.getElementById('root')).render(<React.StrictMode><UIProvider><OfflineGuard><AccessGate><CloudApp/></AccessGate></OfflineGuard></UIProvider></React.StrictMode>);
// Presentation-only, once-per-element reveals; no workspace state or routing changes.
if(typeof window!=='undefined'&&typeof IntersectionObserver!=='undefined'){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const seen=new WeakSet();
 const selector='.page-heading,.page-container>.panel,.page-container>.kpi-grid,.page-container>.two-columns,.page-container>.three-columns,.access-shell>header,.access-shell>.panel,#root main.panel';
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);if(reduced.matches)continue;requestAnimationFrame(()=>{entry.target.classList.add('jf-reveal');entry.target.addEventListener('animationend',()=>entry.target.classList.remove('jf-reveal'),{once:true});});}},{threshold:0.04});
 const watch=node=>{if(!(node instanceof Element))return;const targets=[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)];for(const el of targets){if(seen.has(el))continue;seen.add(el);observer.observe(el);}};
 const root=document.getElementById('root');
 if(root){watch(root);new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)watch(node);}).observe(root,{childList:true,subtree:true});}
}
