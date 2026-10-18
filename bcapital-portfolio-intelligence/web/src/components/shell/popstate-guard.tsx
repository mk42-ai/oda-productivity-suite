/**
 * Back/forward-before-hydration guard (root cause of the /news and /overview React #418 under back/forward spam).
 *
 * The App Router hydrates the document against the RSC payload embedded in that SAME document, but it reads the route from
 * `window.location`. A browser back/forward that fires while a large streamed page (/news ≈ 1.9 MB of HTML) is still parsing or
 * hydrating changes `location` (bfcache / same-document traversal) before `hydrateRoot` finishes — React then hydrates /news markup
 * against the /overview tree and throws #418 (observed live: SSR text "2,100 items · 137 companies" vs client "136 companies · …").
 *
 * The fix is at the source: until the router has hydrated, a history traversal that changes the URL (popstate, or the Navigation API's
 * `currententrychange` of type "traverse", which fires first) stops the in-flight document (window.stop — no further streamed chunks or
 * hydration scripts) and replaces it with a full document load of the new URL, so the markup and the payload always come from the same
 * response. Hash-only changes update the recorded URL instead of reloading. After hydration the guard removes itself and the App Router's own
 * popstate handling (client-side restore) applies unchanged. Inline + synchronous so it is registered before any streamed chunk.
 */
/*
 * 2026-10-18 (polish run 2): the guard stays ARMED until BOTH the root has hydrated AND the document has finished loading (window "load":
 * every streamed Suspense chunk applied). Previously it disarmed as soon as the shell hydrated, while /news boundaries were still streaming
 * (`<!--$?-->` + `<template id="B:n">`), so a traversal in that window let the router render another route into a half-streamed document.
 * While armed, a URL-changing traversal stops the document, swallows the event (stopImmediatePropagation, so the App Router never starts a
 * client transition) and replaces the page with a full load of the new URL. bfcache: a `pageshow` with persisted=true that restores a page
 * frozen mid-stream (pending boundaries still in the DOM) is reloaded instead of resumed.
 */
const GUARD = `(function(){try{
var hydrated=false, loaded=document.readyState==='complete', armed=true, href=location.href, fired=false;
function disarm(){ if(hydrated&&loaded&&armed){ armed=false; window.removeEventListener('popstate',onPop,true); } }
function hard(){ if(fired) return; fired=true; try{ window.stop(); }catch(x){} window.location.replace(window.location.href); }
function onPop(e){ if(!armed||fired) return; if(location.href===href) return; try{ e.stopImmediatePropagation(); }catch(x){} hard(); }
window.addEventListener('popstate',onPop,true);
window.addEventListener('hashchange',function(){ href=location.href; },true);
window.addEventListener('load',function(){ loaded=true; disarm(); });
window.addEventListener('pageshow',function(e){ if(e&&e.persisted){ var pending=document.querySelector('template[id^="B:"]')||document.documentElement.innerHTML.indexOf('<!--$?-->')>=0; if(pending||!hydrated){ fired=false; hard(); } } });
window.__bcapMarkHydrated=function(){ hydrated=true; disarm(); };
}catch(e){}})();`;

export function PopstateGuardScript() {
  return <script id="bcap-popstate-guard" dangerouslySetInnerHTML={{ __html: GUARD }} />;
}
