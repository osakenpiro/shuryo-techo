window.MH_PORTAL_MODEL_V01 = {
  schemaVersion: "0.1",
  modelId: "mh-portal-semantic-contract",

  portalStates: ["PAST", "CURRENT", "NEXT", "HORIZON"],

  titleIds: ["world", "iceborne", "rise", "sunbreak", "wilds", "ascendance"],

  titles: {
    world: {
      id: "world",
      short: "WORLD",
      displayName: "MONSTER HUNTER: WORLD",
      jpName: "モンスターハンター：ワールド",
      portalState: "PAST",
      relation: { kind: "BASE_GAME", expansionId: "iceborne" },
      copyRef: "copy.title.world",
      routeRef: "route.packages",
      assetRefs: { package: "asset.package.world", hero: null }
    },
    iceborne: {
      id: "iceborne",
      short: "ICEBORNE",
      displayName: "MONSTER HUNTER WORLD: ICEBORNE",
      jpName: "モンスターハンターワールド：アイスボーン",
      portalState: "CURRENT",
      relation: { kind: "EXPANSION", baseGameId: "world" },
      copyRef: "copy.title.iceborne",
      routeRef: "route.iceborneNotebook",
      assetRefs: { package: "asset.package.iceborne", hero: "asset.hero.iceborne" }
    },
    rise: {
      id: "rise",
      short: "RISE",
      displayName: "MONSTER HUNTER RISE",
      jpName: "モンスターハンターライズ",
      portalState: "PAST",
      relation: { kind: "BASE_GAME", expansionId: "sunbreak" },
      copyRef: "copy.title.rise",
      routeRef: "route.memory",
      assetRefs: { package: "asset.package.rise", hero: null }
    },
    sunbreak: {
      id: "sunbreak",
      short: "SUNBREAK",
      displayName: "MONSTER HUNTER RISE: SUNBREAK",
      jpName: "モンスターハンターライズ：サンブレイク",
      portalState: "PAST",
      relation: { kind: "EXPANSION", baseGameId: "rise" },
      copyRef: "copy.title.sunbreak",
      routeRef: "route.memory",
      assetRefs: { package: "asset.package.sunbreak", hero: null }
    },
    wilds: {
      id: "wilds",
      short: "WILDS",
      displayName: "MONSTER HUNTER WILDS",
      jpName: "モンスターハンターワイルズ",
      portalState: "NEXT",
      relation: { kind: "BASE_GAME", expansionId: "ascendance" },
      copyRef: "copy.title.wilds",
      routeRef: "route.future",
      assetRefs: {
        package: "asset.package.wilds",
        hero: "asset.hero.wilds",
        keyVisual: "asset.keyVisual.wilds",
        primaryMedia: "asset.media.wilds.primary"
      }
    },
    ascendance: {
      id: "ascendance",
      short: "ASCENDANCE",
      displayName: "MONSTER HUNTER WILDS: ASCENDANCE",
      jpName: "モンスターハンターワイルズ：アセンダンス",
      portalState: "HORIZON",
      relation: { kind: "EXPANSION", baseGameId: "wilds" },
      availability: {
        releaseState: "ANNOUNCED_FUTURE",
        announcedYear: 2027,
        evidenceRef: "github:osakenpiro/claude-shared#329"
      },
      copyRef: "copy.title.ascendance",
      routeRef: "route.future",
      assetRefs: {
        package: "asset.package.ascendance",
        keyVisual: "asset.keyVisual.ascendance",
        primaryMedia: "asset.media.ascendance.primary"
      }
    }
  },

  weaponCatalog: {
    "great-sword": { id: "great-sword", jp: "大剣" },
    "long-sword": { id: "long-sword", jp: "太刀" },
    "sword-shield": { id: "sword-shield", jp: "片手剣" },
    "dual-blades": { id: "dual-blades", jp: "双剣" },
    "hammer": { id: "hammer", jp: "ハンマー" },
    "hunting-horn": { id: "hunting-horn", jp: "狩猟笛" },
    "lance": { id: "lance", jp: "ランス" },
    "gunlance": { id: "gunlance", jp: "ガンランス" },
    "switch-axe": { id: "switch-axe", jp: "スラッシュアックス" },
    "charge-blade": { id: "charge-blade", jp: "チャージアックス" },
    "insect-glaive": { id: "insect-glaive", jp: "操虫棍" },
    "light-bowgun": { id: "light-bowgun", jp: "ライトボウガン" },
    "heavy-bowgun": { id: "heavy-bowgun", jp: "ヘビィボウガン" },
    "bow": { id: "bow", jp: "弓" }
  },

  hunterState: {
    hunterId: "self",
    currentTitleId: "iceborne",
    currentGoal: {
      kind: "TARGET_MONSTER",
      label: "ミラボレアス",
      evidenceState: "USER_RECORDED"
    },
    currentLoadout: {
      mainWeaponId: "switch-axe",
      practiceWeaponIds: ["bow", "charge-blade"],
      evidenceState: "USER_RECORDED"
    },
    knownMetrics: {
      hunterRank: { state: "NOT_RECORDED", value: null },
      totalHunts: { state: "NOT_RECORDED", value: null }
    },
    history: [
      {
        titleId: "rise",
        state: "PAST",
        weaponIds: ["dual-blades", "long-sword"],
        evidenceState: "USER_RECORDED"
      },
      {
        titleId: "wilds",
        state: "NEXT",
        plannedWeaponIds: ["gunlance", "hammer"],
        evidenceState: "USER_RECORDED"
      },
      {
        titleId: "iceborne",
        state: "CURRENT",
        mainWeaponIds: ["switch-axe"],
        practiceWeaponIds: ["bow", "charge-blade"],
        evidenceState: "USER_RECORDED"
      }
    ]
  },

  titleRelations: [
    { from: "world", to: "iceborne", kind: "EXPANDS_TO" },
    { from: "rise", to: "sunbreak", kind: "EXPANDS_TO" },
    { from: "wilds", to: "ascendance", kind: "EXPANDS_TO" },
    { from: "iceborne", to: "wilds", kind: "HUNTER_ROUTE_NEXT" }
  ],

  routes: {
    "route.home": { id: "route.home", target: "#home", state: "READY" },
    "route.packages": { id: "route.packages", target: "#packages", state: "READY" },
    "route.current": { id: "route.current", target: "#current", state: "READY" },
    "route.future": { id: "route.future", target: "#future", state: "READY" },
    "route.memory": { id: "route.memory", target: "#memory", state: "READY" },
    "route.iceborneNotebook": {
      id: "route.iceborneNotebook",
      target: "hunting-notebook.html",
      state: "READY"
    }
  },

  copy: {
    "copy.title.world": {
      shortLine: "新たな生命の地へ",
      note: "現在の狩猟線につながる過去の入口。"
    },
    "copy.title.iceborne": {
      shortLine: "さらなる、深き世界へ",
      note: "現在の狩り。MR攻略中、目標はミラボレアス。"
    },
    "copy.title.rise": {
      shortLine: "翔け上がる、狩猟の新風",
      note: "双剣と太刀を使っていた時期の記憶。"
    },
    "copy.title.sunbreak": {
      shortLine: "炎よ、再び大地を照らせ",
      note: "RISE系統の過去を構成する拡張側の記憶。"
    },
    "copy.title.wilds": {
      shortLine: "まだ見ぬ野生が、世界を変える",
      note: "Iceborneの次に戻る狩場。"
    },
    "copy.title.ascendance": {
      shortLine: "その先の狩りへ",
      note: "発表済みの未来拡張。未発表の詳細はTBAのまま扱う。"
    }
  },

  assetBindings: {
    "asset.package.world": { id: "asset.package.world", publicationState: "ASSET_PENDING", consumer: "SES-A" },
    "asset.package.iceborne": { id: "asset.package.iceborne", publicationState: "ASSET_PENDING", consumer: "SES-A" },
    "asset.package.rise": { id: "asset.package.rise", publicationState: "ASSET_PENDING", consumer: "SES-A" },
    "asset.package.sunbreak": { id: "asset.package.sunbreak", publicationState: "ASSET_PENDING", consumer: "SES-A" },
    "asset.package.wilds": { id: "asset.package.wilds", publicationState: "ASSET_PENDING", consumer: "SES-A" },
    "asset.package.ascendance": { id: "asset.package.ascendance", publicationState: "ASSET_PENDING", consumer: "SES-A" },

    "asset.hero.iceborne": { id: "asset.hero.iceborne", publicationState: "ASSET_PENDING", consumer: "SES-A" },
    "asset.hero.wilds": { id: "asset.hero.wilds", publicationState: "ASSET_PENDING", consumer: "SES-A" },

    "asset.keyVisual.wilds": { id: "asset.keyVisual.wilds", publicationState: "ASSET_PENDING", consumer: "SES-C" },
    "asset.keyVisual.ascendance": { id: "asset.keyVisual.ascendance", publicationState: "ASSET_PENDING", consumer: "SES-C" },
    "asset.media.wilds.primary": { id: "asset.media.wilds.primary", publicationState: "ASSET_PENDING", consumer: "SES-C" },
    "asset.media.ascendance.primary": { id: "asset.media.ascendance.primary", publicationState: "ASSET_PENDING", consumer: "SES-C" }
  },

  legacyRefs: {
    sourceFile: "portal-data.js",
    sourceSha: "cf81e55f2a7b7861b769203538ea093f7718ba71",
    legacyOriginalArt: [
      "mhwib-hero",
      "wilds-hero",
      "rise-hero",
      "mhwib-package",
      "wilds-package",
      "rise-package"
    ],
    note: "Legacy ORIGINAL_CODE_NATIVE_ART refs are preserved for migration evidence only. They are not automatically promoted to publication bindings."
  }
};