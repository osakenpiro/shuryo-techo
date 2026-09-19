// SES-O derived runtime adapter v0.1
// Sources: SES-E semantic contract + SES-D provenance ledger.
// This file is a projection/binding adapter, not a new SoT.
window.MH_PORTAL_ASSET_LEDGER_V01 = {
  "schema": "MH_PORTAL_ASSET_LEDGER_V0.1",
  "checkedAt": "2026-09-19",
  "policy": {
    "fakeOfficial": "FORBIDDEN",
    "unverifiedHotlink": "FORBIDDEN",
    "officialReference": "ALLOWED_FOR_DESIGN_AUDIT",
    "publication": "REQUIRES_EXPLICIT_USE_POSTURE",
    "defaultUnknown": "ASSET_PENDING"
  },
  "items": [
    {
      "id": "asset.package.world",
      "kind": "package",
      "consumer": "SES-A",
      "officialSource": "https://store.captown.capcom.com/products/281619-jp",
      "sourceOwner": "CAPCOM / Capcom Town Store",
      "sourceType": "OFFICIAL_PRODUCT_PAGE",
      "candidateRole": "OFFICIAL_PRODUCT_IMAGE_REFERENCE",
      "editionRegion": "JP_STEAM_PRODUCT_PAGE / PHYSICAL_EDITION_UNRESOLVED",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY_SELECT_EXACT_EDITION_BEFORE_BINDING",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Official product imagery exists. Do not treat the Steam product image as a cleared physical-package face."
    },
    {
      "id": "asset.package.iceborne",
      "kind": "package",
      "consumer": "SES-A",
      "officialSource": "https://store.captown.capcom.com/products/378547-jp",
      "alternateOfficialSource": "https://store.captown.capcom.com/products/428132-jp",
      "sourceOwner": "CAPCOM / Capcom Town Store",
      "sourceType": "OFFICIAL_PRODUCT_PAGE",
      "candidateRole": "OFFICIAL_PRODUCT_IMAGE_REFERENCE",
      "editionRegion": "JP_STEAM_EXPANSION / MASTER_EDITION_REFERENCE_AVAILABLE",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY_SELECT_ICEBORNE_OR_MASTER_EDITION_EXPLICITLY",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Iceborne expansion and Master Edition are distinct official product presentations. A must choose the intended shelf edition deliberately."
    },
    {
      "id": "asset.package.rise",
      "kind": "package",
      "consumer": "SES-A",
      "officialSource": "https://store.captown.capcom.com/products/626191-jp",
      "sourceOwner": "CAPCOM / Capcom Town Store",
      "sourceType": "OFFICIAL_PRODUCT_PAGE",
      "candidateRole": "OFFICIAL_PRODUCT_IMAGE_REFERENCE",
      "editionRegion": "JP_STEAM_PRODUCT_PAGE / PHYSICAL_EDITION_UNRESOLVED",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY_SELECT_EXACT_EDITION_BEFORE_BINDING",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Official product imagery exists; exact physical shelf edition remains unresolved."
    },
    {
      "id": "asset.package.sunbreak",
      "kind": "package",
      "consumer": "SES-A",
      "officialSource": "https://store.captown.capcom.com/en/products/677034-jp",
      "alternateOfficialSource": "https://store.captown.capcom.com/en/products/692569-jp",
      "sourceOwner": "CAPCOM / Capcom Town Store",
      "sourceType": "OFFICIAL_PRODUCT_PAGE",
      "candidateRole": "OFFICIAL_EXPANSION_PRODUCT_REFERENCE",
      "editionRegion": "DIGITAL_EXPANSION / RISE_PLUS_SUNBREAK_BUNDLE_REFERENCE_AVAILABLE",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY_DO_NOT_INVENT_STANDALONE_RETAIL_BOX",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Official Sunbreak expansion imagery exists. Treat standalone physical-case representation as a design object unless an exact physical edition is selected and verified."
    },
    {
      "id": "asset.package.wilds",
      "kind": "package",
      "consumer": "SES-A",
      "officialSource": "https://store.captown.capcom.com/products/805461-jp",
      "alternateOfficialSource": "https://store.captown.capcom.com/products/1723312-jp",
      "sourceOwner": "CAPCOM / Capcom Town Store",
      "sourceType": "OFFICIAL_PRODUCT_PAGE",
      "candidateRole": "OFFICIAL_PRODUCT_IMAGE_REFERENCE",
      "editionRegion": "JP_STEAM_BASE_GAME / GOLD_EDITION_REFERENCE_AVAILABLE",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY_BASE_GAME_PREFERRED_FOR_TITLE_SHELF",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Use base-game identity for the title shelf unless A explicitly chooses another edition."
    },
    {
      "id": "asset.package.ascendance",
      "kind": "package",
      "consumer": "SES-A",
      "officialSource": "https://www.capcom.co.jp/ir/news/html/260608b.html",
      "alternateOfficialSource": "https://captown.capcom.com/en/theaters/monsterhunter/56",
      "sourceOwner": "CAPCOM",
      "sourceType": "OFFICIAL_PRESS_AND_TRAILER_REFERENCE",
      "candidateRole": "TITLE_IDENTITY_REFERENCE_ONLY",
      "editionRegion": "2027_EXPANSION / RETAIL_PACKAGE_NOT_CONFIRMED",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "KEEP_ASSET_PENDING_UNTIL_EXACT_PACKAGE_OR_APPROVED_TITLE_ART_IS_IDENTIFIED",
      "publicationState": "ASSET_PENDING",
      "notes": "Announcement/trailer are official, but no exact shelf-package face is confirmed in this audit."
    },
    {
      "id": "asset.hero.iceborne",
      "kind": "hero",
      "consumer": "SES-A",
      "officialSource": "https://store.captown.capcom.com/products/378547-jp",
      "sourceOwner": "CAPCOM / Capcom Town Store",
      "sourceType": "OFFICIAL_PRODUCT_PAGE",
      "candidateRole": "ATMOSPHERE_KEY_ART_REFERENCE",
      "editionRegion": "ICEBORNE",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY_ORIGINAL_WORLD_PLATE_REMAINS_ALLOWED",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Use to study atmosphere/crop, not as automatic publication-cleared background."
    },
    {
      "id": "asset.hero.wilds",
      "kind": "hero",
      "consumer": "SES-A",
      "officialSource": "https://store.captown.capcom.com/products/805461-jp",
      "sourceOwner": "CAPCOM / Capcom Town Store",
      "sourceType": "OFFICIAL_PRODUCT_PAGE",
      "candidateRole": "ATMOSPHERE_KEY_ART_REFERENCE",
      "editionRegion": "WILDS_BASE_GAME",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Official product imagery is a design reference; exact publication asset still requires an explicit binding decision."
    },
    {
      "id": "asset.keyVisual.wilds",
      "kind": "keyVisual",
      "consumer": "SES-C",
      "officialSource": "https://store.captown.capcom.com/products/805461-jp",
      "alternateOfficialSource": "https://captown.capcom.com/en/theaters/monsterhunter/12",
      "sourceOwner": "CAPCOM",
      "sourceType": "OFFICIAL_PRODUCT_AND_THEATER_REFERENCE",
      "candidateRole": "FUTURE_VISUAL_REFERENCE",
      "editionRegion": "WILDS_BASE_GAME",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY_CONFIRM_EXACT_KEY_VISUAL_BEFORE_BINDING",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Official sources contain Wilds imagery, but this ledger does not claim a specific image is the canonical key visual."
    },
    {
      "id": "asset.keyVisual.ascendance",
      "kind": "keyVisual",
      "consumer": "SES-C",
      "officialSource": "https://www.capcom.co.jp/ir/news/html/images/260608c.png",
      "alternateOfficialSource": "https://www.capcom.co.jp/ir/english/news/html/e260608b.html",
      "sourceOwner": "CAPCOM",
      "sourceType": "OFFICIAL_PRESS_RELEASE_KEY_VISUAL",
      "candidateRole": "EXACT_OFFICIAL_KEY_VISUAL_REFERENCE",
      "editionRegion": "ASCENDANCE_2027",
      "rightsStatus": "OFFICIAL_SOURCE_REUSE_NOT_CLEARED",
      "strategy": "REFERENCE_ONLY_DO_NOT_REHOST_UNTIL_USE_POSTURE_IS_RESOLVED",
      "publicationState": "REFERENCE_ONLY",
      "notes": "Exact official key visual located in Capcom IR press release. Reference is verified; reuse/publication remains uncleared."
    },
    {
      "id": "asset.media.wilds.primary",
      "kind": "media",
      "consumer": "SES-C",
      "officialSource": "https://www.youtube.com/watch?v=a_wNFT4j6qI",
      "alternateOfficialSource": "https://captown.capcom.com/en/theaters/monsterhunter/12",
      "sourceOwner": "Monster Hunter / CAPCOM",
      "sourceType": "OFFICIAL_VERIFIED_YOUTUBE_TRAILER",
      "candidateRole": "PRIMARY_EXPEDITION_MEDIA",
      "editionRegion": "WILDS_LAUNCH_TRAILER_2025",
      "rightsStatus": "OFFICIAL_STREAM_REHOST_NOT_AUTHORIZED",
      "strategy": "OFFICIAL_LINK_OR_STANDARD_EMBED_CANDIDATE_DO_NOT_DOWNLOAD_REHOST",
      "publicationState": "EMBED_CANDIDATE",
      "notes": "Verify actual embed availability at integration time. Prefer official player/link over local copy."
    },
    {
      "id": "asset.media.ascendance.primary",
      "kind": "media",
      "consumer": "SES-C",
      "officialSource": "https://www.youtube.com/watch?v=ZeMKYURp_A8",
      "alternateOfficialSource": "https://www.youtube.com/watch?v=URrMx-2l_ek",
      "tertiaryOfficialSource": "https://captown.capcom.com/en/theaters/monsterhunter/56",
      "sourceOwner": "Monster Hunter / CAPCOM",
      "sourceType": "OFFICIAL_VERIFIED_YOUTUBE_TRAILER",
      "candidateRole": "PRIMARY_EXPEDITION_MEDIA",
      "editionRegion": "ASCENDANCE_1ST_TRAILER_2026-09-03",
      "rightsStatus": "OFFICIAL_STREAM_REHOST_NOT_AUTHORIZED",
      "strategy": "OFFICIAL_LINK_OR_STANDARD_EMBED_CANDIDATE_DO_NOT_DOWNLOAD_REHOST",
      "publicationState": "EMBED_CANDIDATE",
      "notes": "Use the later 1st Trailer as primary candidate; keep Reveal Trailer as secondary evidence. Verify embed availability at integration time."
    }
  ]
};

(() => {
  const model = window.MH_PORTAL_MODEL_V01;
  const assetLedger = window.MH_PORTAL_ASSET_LEDGER_V01;
  if (!model || !assetLedger) return;

  const byId = Object.fromEntries((assetLedger.items || []).map(item => [item.id, item]));
  for (const [id, binding] of Object.entries(model.assetBindings || {})) {
    const item = byId[id];
    if (!item) continue;
    Object.assign(binding, {
      publicationState: item.publicationState,
      rightsStatus: item.rightsStatus,
      strategy: item.strategy,
      sourceOwner: item.sourceOwner,
      sourceType: item.sourceType,
      officialSource: item.officialSource,
      editionRegion: item.editionRegion
    });
  }

  // Presentation relation intentionally distinct from hunter practice state.
  model.presentation = model.presentation || {};
  model.presentation.currentWorkbench = {
    notebookArtifactWeaponIds: ["switch-axe", "bow", "great-sword"],
    evidenceRef: "github:osakenpiro/claude-shared#328",
    note: "Presentation/destination artifacts; not equivalent to hunterState.currentLoadout.practiceWeaponIds."
  };

  document.documentElement.dataset.semanticModel = model.schemaVersion || "unknown";
  document.documentElement.dataset.assetLedger = assetLedger.schema || "unknown";

  const currentTitle = model.titles?.[model.hunterState?.currentTitleId];
  const weapon = model.weaponCatalog?.[model.hunterState?.currentLoadout?.mainWeaponId];

  const activeHunter = document.querySelector(".active-hunter");
  if (activeHunter && currentTitle) activeHunter.textContent = "CURRENT: " + currentTitle.short;

  const weaponStatus = document.getElementById("weaponStatus");
  if (weaponStatus && weapon) weaponStatus.textContent = "CURRENT WEAPON — " + weapon.jp;

  const rows = [...document.querySelectorAll(".log-row")];
  const metrics = model.hunterState?.knownMetrics || {};
  for (const row of rows) {
    const label = row.querySelector("span")?.textContent?.trim();
    const strong = row.querySelector("strong");
    if (!strong) continue;
    if (label === "HR") {
      const m = metrics.hunterRank;
      strong.textContent = m?.state === "NOT_RECORDED" ? "— 未記録" : String(m?.value ?? "—");
    }
    if (label === "総狩猟数") {
      const m = metrics.totalHunts;
      strong.textContent = m?.state === "NOT_RECORDED" ? "— 未記録" : String(m?.value ?? "—");
    }
  }
})();
