const path = require("path");

global.window = {};
require(path.resolve(__dirname, "..", "portal-data-v2.js"));

const m = global.window.MH_PORTAL_MODEL_V01;
const failures = [];
const pass = (name, cond) => { if (!cond) failures.push(name); };

const expectedTitles = ["world","iceborne","rise","sunbreak","wilds","ascendance"];
pass("schema_version", m.schemaVersion === "0.1");
pass("six_title_ids", JSON.stringify(m.titleIds) === JSON.stringify(expectedTitles));
pass("six_title_objects", JSON.stringify(Object.keys(m.titles)) === JSON.stringify(expectedTitles));

const expectedStates = {
  world:"PAST",
  iceborne:"CURRENT",
  rise:"PAST",
  sunbreak:"PAST",
  wilds:"NEXT",
  ascendance:"HORIZON"
};
for (const [id,state] of Object.entries(expectedStates)) {
  pass("state_"+id, m.titles[id].portalState === state);
}

pass("current_title_semantic", m.hunterState.currentTitleId === "iceborne");
pass("main_weapon_semantic", m.hunterState.currentLoadout.mainWeaponId === "switch-axe");
pass("practice_weapons", JSON.stringify(m.hunterState.currentLoadout.practiceWeaponIds) === JSON.stringify(["bow","charge-blade"]));

pass("hr_not_recorded",
  m.hunterState.knownMetrics.hunterRank.state === "NOT_RECORDED" &&
  m.hunterState.knownMetrics.hunterRank.value === null
);
pass("hunt_count_not_recorded",
  m.hunterState.knownMetrics.totalHunts.state === "NOT_RECORDED" &&
  m.hunterState.knownMetrics.totalHunts.value === null
);

pass("no_hr_on_title_identity", !Object.values(m.titles).some(t => Object.prototype.hasOwnProperty.call(t,"hr")));
pass("no_progress_on_title_identity", !Object.values(m.titles).some(t => Object.prototype.hasOwnProperty.call(t,"progress")));

const routeIds = Object.keys(m.routes);
pass("route_ids_unique", routeIds.length === new Set(routeIds).size);
pass("core_routes_present", ["route.home","route.packages","route.current","route.future","route.memory"].every(id => m.routes[id]));

const assetIds = Object.keys(m.assetBindings);
pass("asset_ids_unique", assetIds.length === new Set(assetIds).size);
pass("assets_are_ids_not_urls", assetIds.every(id => !/^https?:/i.test(id)));
pass("all_current_bindings_pending", Object.values(m.assetBindings).every(a => a.publicationState === "ASSET_PENDING"));

const weaponIds = Object.keys(m.weaponCatalog);
pass("fourteen_weapons", weaponIds.length === 14);
pass("weapon_ids_unique", weaponIds.length === new Set(weaponIds).size);

pass("ascendance_announced_future",
  m.titles.ascendance.availability.releaseState === "ANNOUNCED_FUTURE" &&
  m.titles.ascendance.availability.announcedYear === 2027
);

pass("legacy_not_promoted",
  Array.isArray(m.legacyRefs.legacyOriginalArt) &&
  m.legacyRefs.note.includes("not automatically promoted")
);

if (failures.length) {
  console.error(JSON.stringify({ok:false, failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok:true,
  checks: 26,
  titles: expectedTitles,
  currentTitle: m.hunterState.currentTitleId,
  mainWeapon: m.hunterState.currentLoadout.mainWeaponId,
  assetBindings: assetIds.length,
  routes: routeIds.length
}, null, 2));
