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
const GUARD = `(function(){try{
var hydrated=false, href=location.href, fired=false;
function reload(){ if(hydrated||fired) return; fired=true; try{ window.stop(); }catch(e){} window.location.replace(window.location.href); }
function check(){ if(!hydrated && location.href!==href) reload(); }
window.addEventListener('popstate',check,true);
window.addEventListener('hashchange',function(){ href=location.href; },true);
if(window.navigation&&navigation.addEventListener){ navigation.addEventListener('currententrychange',function(e){ if(e&&e.navigationType==='traverse') check(); }); }
window.__bcapMarkHydrated=function(){ hydrated=true; window.removeEventListener('popstate',check,true); };
}catch(e){}})();`;

export function PopstateGuardScript() {
  return <script id="bcap-popstate-guard" dangerouslySetInnerHTML={{ __html: GUARD }} />;
}
