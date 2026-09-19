const fs=require("fs");
const path=require("path");

global.window={};
require(path.resolve(__dirname,"..","portal-data-v2.js"));
const model=global.window.MH_PORTAL_MODEL_V01;
const ledger=JSON.parse(fs.readFileSync(path.resolve(__dirname,"..","portal-assets-v0.1.json"),"utf8"));

const allowedStates=new Set(["REFERENCE_ONLY","ASSET_PENDING","EMBED_CANDIDATE"]);
const allowedHosts=new Set(["store.captown.capcom.com","captown.capcom.com","www.capcom.co.jp","www.youtube.com"]);
const fail=[];
const ok=(name,cond)=>{if(!cond)fail.push(name)};

const semanticIds=Object.keys(model.assetBindings).sort();
const ledgerIds=ledger.items.map(x=>x.id).sort();

ok("schema",ledger.schema==="MH_PORTAL_ASSET_LEDGER_V0.1");
ok("covers_all_semantic_asset_ids",JSON.stringify(semanticIds)===JSON.stringify(ledgerIds));
ok("unique_ids",ledgerIds.length===new Set(ledgerIds).size);
ok("allowed_publication_states",ledger.items.every(x=>allowedStates.has(x.publicationState)));
ok("official_sources_only",ledger.items.every(x=>{try{return allowedHosts.has(new URL(x.officialSource).hostname)}catch{return false}}));
ok("no_cdn_hotlinks",ledger.items.every(x=>!/(cdn|akamai|cloudfront|imgur)/i.test(x.officialSource)));
ok("no_download_rehost_media",ledger.items.filter(x=>x.kind==="media").every(x=>/DO_NOT_DOWNLOAD_REHOST/.test(x.strategy)));
ok("ascendance_package_pending",ledger.items.find(x=>x.id==="asset.package.ascendance")?.publicationState==="ASSET_PENDING");
ok("ascendance_keyvisual_pending",ledger.items.find(x=>x.id==="asset.keyVisual.ascendance")?.publicationState==="ASSET_PENDING");
ok("wilds_media_embed_candidate",ledger.items.find(x=>x.id==="asset.media.wilds.primary")?.publicationState==="EMBED_CANDIDATE");
ok("asc_media_embed_candidate",ledger.items.find(x=>x.id==="asset.media.ascendance.primary")?.publicationState==="EMBED_CANDIDATE");
ok("image_reuse_not_claimed",ledger.items.filter(x=>x.kind!=="media").every(x=>x.rightsStatus.includes("REUSE_NOT_CLEARED")));

if(fail.length){
  console.error(JSON.stringify({ok:false,fail},null,2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok:true,
  checks:12,
  items:ledger.items.length,
  referenceOnly:ledger.items.filter(x=>x.publicationState==="REFERENCE_ONLY").length,
  assetPending:ledger.items.filter(x=>x.publicationState==="ASSET_PENDING").length,
  embedCandidate:ledger.items.filter(x=>x.publicationState==="EMBED_CANDIDATE").length
},null,2));