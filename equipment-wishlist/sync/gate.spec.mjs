import {test,expect} from '@playwright/test';
for (const width of [320,390,768,1440]) {
  test(`unconfigured shared gate is honest, inert and readable at ${width}px`,async({page})=>{
    const errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765'))external.push(r.url());});
    await page.setViewportSize({width,height:950});
    await page.goto('/equipment-wishlist/sync/');
    await expect(page.locator('#sync-state')).toHaveText('接続設定待ち');
    await expect(page.locator('#login')).toBeDisabled();
    await expect(page.locator('#private')).toBeHidden();
    await expect(page.locator('#gate-message')).toContainText('まだ自動同期は始まっていません');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await page.evaluate(()=>localStorage.getItem('mhwi-equipment-requests-v1'))).toBe(null);
    expect(errors).toEqual([]);expect(external).toEqual([]);
    await page.screenshot({path:`test-results/shared-gate-${width}.png`,fullPage:true});
  });
}
test('visiting the shared page does not modify an existing local record',async({page})=>{
  await page.goto('/equipment-wishlist/sync/');
  const raw=JSON.stringify({version:1,hunters:[{id:'osakenpiro',requests:[],stock:{kept:77}}],plan:[]});
  await page.evaluate(raw=>localStorage.setItem('mhwi-equipment-requests-v1',raw),raw);
  await page.reload();await expect(page.locator('#sync-state')).toHaveText('接続設定待ち');
  expect(await page.evaluate(()=>localStorage.getItem('mhwi-equipment-requests-v1'))).toBe(raw);
  await page.getByRole('link',{name:'共有開始までの確認事項 →'}).click();
  await expect(page.locator('body')).toContainText('現在は本番接続設定待ち');
});
