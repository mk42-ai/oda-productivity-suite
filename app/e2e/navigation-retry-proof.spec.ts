import { test, expect } from "@playwright/test";
import fs from "node:fs"; import path from "node:path";
const PROOF = process.env.PROOF_DIR!; fs.mkdirSync(PROOF,{recursive:true});
const FAIL=[`data: ${JSON.stringify({type:"RUN_STARTED",threadId:"t",runId:"r1"})}`,`data: ${JSON.stringify({type:"RUN_ERROR",message:"The answer could not be completed",code:"upstream_http"})}`,"data: [DONE]",""].join("\n")+"\n";
const OK=[`data: ${JSON.stringify({type:"RUN_STARTED",threadId:"t",runId:"r2"})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_START",messageId:"m1"})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_CONTENT",messageId:"m1",delta:"Retry succeeded: Technology Innovation Institute is a UAE research institute on the watchlist."})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_END",messageId:"m1"})}`,`data: ${JSON.stringify({type:"RUN_FINISHED",threadId:"t",runId:"r2"})}`,"data: [DONE]",""].join("\n")+"\n";
for (const vp of [{w:1440,h:900,label:"1440x900"},{w:390,h:844,label:"390x844"}]) {
  test(`retry proof ${vp.label}`, async ({ page }) => {
    await page.setViewportSize({width:vp.w,height:vp.h});
    await page.addInitScript(()=>localStorage.setItem("uaecc.settings.v1", JSON.stringify({onboarded:true,apikey:"",externalUserId:"INV-001",model:"predefined-deepseek-flash",companies:["tii"]})));
    let posts=0;
    await page.route("**/api/chat", async r=>{ if(r.request().method()==="POST"){posts++; await r.fulfill({status:200,contentType:"text/event-stream",body:FAIL});} else await r.continue(); });
    await page.goto("/chat?skip=1");
    await page.getByTestId("composer-input").fill("Tell me about Technology Innovation Institute in one line.");
    await page.getByTestId("composer-send").click();
    await expect(page.getByTestId("chat-error")).toBeVisible({timeout:30000});
    await expect(page.getByTestId("chat-error")).toContainText("Response failed");
    expect((await page.locator("body").innerText()).toLowerCase()).not.toContain("the answer could not be completed");
    await page.screenshot({path:path.join(PROOF,`nav-retry-error-${vp.label}.png`)});
    await page.unroute("**/api/chat");
    await page.route("**/api/chat", async r=>{ if(r.request().method()==="POST"){posts++; await r.fulfill({status:200,contentType:"text/event-stream",body:OK});} else await r.continue(); });
    const before=posts; await page.getByTestId("chat-error-retry").click();
    await expect.poll(()=>posts).toBeGreaterThan(before);
    await expect(page.locator("body")).toContainText("Retry succeeded: Technology Innovation Institute",{timeout:30000});
    await page.screenshot({path:path.join(PROOF,`nav-retry-recovered-${vp.label}.png`)});
  });
}
