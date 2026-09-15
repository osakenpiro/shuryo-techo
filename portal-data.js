window.MH_PORTAL_DATA = {
  assetLedger: [
    { id: "mhwib-hero", path: "assets/art/mhwib-hero.svg", kind: "hero", alt: "雪煙の凍った狩場と遠い調査拠点を描いたオリジナル背景", focalPoint: "70% center", bytes: 2715, hash: "git:fc7766fcff818d48229239a6679167f582c4c951", rightsStatus: "ORIGINAL_CODE_NATIVE_ART", source: "Original SVG authored for shuryo-techo" },
    { id: "wilds-hero", path: "assets/art/wilds-hero.svg", kind: "hero", alt: "風が走る広い荒野と地平線を描いたオリジナル背景", focalPoint: "70% center", bytes: 2293, hash: "git:1f23773f23d34f39542c63bbf3c692756a0282ea", rightsStatus: "ORIGINAL_CODE_NATIVE_ART", source: "Original SVG authored for shuryo-techo" },
    { id: "rise-hero", path: "assets/art/rise-hero.svg", kind: "hero", alt: "月明かりと灯籠の里を描いたオリジナル背景", focalPoint: "70% center", bytes: 2372, hash: "git:7b77fd9b8dbfde64ca59fc003c6d263dc034c835", rightsStatus: "ORIGINAL_CODE_NATIVE_ART", source: "Original SVG authored for shuryo-techo" },
    { id: "mhwib-package", path: "assets/art/mhwib-package.svg", kind: "package", alt: "雪原と調査拠点を描いたMHW:I用オリジナルパッケージアート", focalPoint: "50% center", bytes: 1483, hash: "git:59ea3455bd36374841c6de0fa51001e74f44d66c", rightsStatus: "ORIGINAL_CODE_NATIVE_ART", source: "Original SVG authored for shuryo-techo" },
    { id: "wilds-package", path: "assets/art/wilds-package.svg", kind: "package", alt: "風の荒野と地平線を描いたWilds用オリジナルパッケージアート", focalPoint: "50% center", bytes: 1535, hash: "git:dfe9faa46d644134cf5fdd1b5cdfbb2c1ffa8770", rightsStatus: "ORIGINAL_CODE_NATIVE_ART", source: "Original SVG authored for shuryo-techo" },
    { id: "rise-package", path: "assets/art/rise-package.svg", kind: "package", alt: "月と灯籠の里を描いたRise用オリジナルパッケージアート", focalPoint: "50% center", bytes: 1705, hash: "git:fbb595ae02996879801b31e8becd0e3048c6b09f", rightsStatus: "ORIGINAL_CODE_NATIVE_ART", source: "Original SVG authored for shuryo-techo" }
  ],
  titles: {
    mhwib: {
      short: "MHW:I",
      name: "ICEBORNE",
      subtitle: "モンスターハンター：ワールド ── アイスボーン",
      status: "進行中",
      progress: "MR攻略中 / 目標：ミラボレアス",
      next: "IBクリア → Wilds",
      tone: "red",
      mark: "ICE",
      art: { hero: "mhwib-hero", package: "mhwib-package" },
      weapons: ["スラッシュアックス"],
      practice: ["弓", "チャージアックス"],
      skills: [
        {
          id: "evade-distance",
          name: "回避距離UP",
          en: "EVADE EXTENDER",
          level: "Lv2",
          priority: "recommended",
          state: "RECOMMEND",
          icon: "fa-solid fa-person-running",
          description: "回避時の移動距離が長くなる。剣モードの移動と位置調整を補う、動画の個人的おすすめ。"
        },
        {
          id: "power-prolonger",
          name: "強化持続",
          en: "POWER PROLONGER",
          level: "Lv3",
          priority: "core",
          state: "CORE",
          icon: "fa-solid fa-bolt",
          description: "Lv3で高出力状態の効果時間が約2倍。零距離解放突きを撃てる時間も増える、実質の火力スキル。"
        },
        {
          id: "tool-specialist",
          name: "整備",
          en: "TOOL SPECIALIST",
          level: "Lv3〜5",
          priority: "conditional",
          state: "ZSD型 CORE",
          icon: "fa-solid fa-stopwatch",
          description: "不動・転身の装衣を早く再使用できる。零距離解放突きを回すなら、実質の火力スキル。"
        },
        {
          id: "earplugs",
          name: "耳栓",
          en: "EARPLUGS",
          level: "Lv1",
          priority: "conditional",
          state: "MATCHUP",
          icon: "fa-solid fa-volume-high",
          description: "零距離解放突き中の耳栓Lv4と合算。Lv1を足すと耳栓Lv5になり、咆哮を無効化できる。"
        }
      ],
      note: "ガーディアン装備を卒業して、マスターランク攻略用の防具と装飾品を集める区画。",
      href: "hunting-notebook.html",
      action: "狩猟手帖をひらく"
    },
    wilds: {
      short: "WILDS",
      name: "WILDS",
      subtitle: "モンスターハンター：ワイルズ",
      status: "次の狩場",
      progress: "IBクリア後に移動",
      next: "ガンランス / ハンマーへ帰還",
      tone: "green",
      mark: "WIND",
      art: { hero: "wilds-hero", package: "wilds-package" },
      weapons: ["ガンランス", "ハンマー"],
      practice: [],
      note: "ワイルズでの持ち武器へ戻るための、次の表紙。入口だけ先に作っておく。",
      href: "",
      action: "入口データを確認"
    },
    rise: {
      short: "RISE",
      name: "RISE / SB",
      subtitle: "モンスターハンターライズ：サンブレイク",
      status: "履歴",
      progress: "プレイ済み / 武器の原点",
      next: "過去の持ち武器を確認",
      tone: "indigo",
      mark: "NIGHT",
      art: { hero: "rise-hero", package: "rise-package" },
      weapons: ["双剣", "太刀"],
      practice: [],
      note: "いまの狩猟線へつながる前の記録。双剣と太刀を使っていた時期。",
      href: "#weapons",
      action: "武器変遷を見る"
    }
  },
  hunters: [
    {
      id: "self",
      label: "PLAYER 001",
      badge: "MAIN HUNTER",
      name: "おれ",
      current: "mhwib",
      cardWeapons: "スラアク · 弓 · チャアク",
      note: "今回はスラアクを主軸にして、弓とチャアクは武器練習レベルで触る。IBをクリアしたらWildsへ。",
      history: [
        {
          title: "rise",
          period: "これまで",
          label: "RISEで使っていた武器",
          state: "archive",
          archive: ["双剣", "太刀"],
          note: "ライズ時代の持ち武器。いまの主軸ではないが、狩猟線の出発点。"
        },
        {
          title: "wilds",
          period: "ワイルズでの持ち武器",
          label: "帰る予定の武器",
          state: "next",
          main: ["ガンランス", "ハンマー"],
          note: "ワイルズではガンランスやハンマーを持っている。IBクリア後に戻る場所。"
        },
        {
          title: "mhwib",
          period: "いまここ",
          label: "MHW:Iのメイン",
          state: "current",
          main: ["スラッシュアックス"],
          practice: ["弓", "チャージアックス"],
          note: "まずはスラアクでミラボレアスまで。弓とチャアクは練習枠。"
        }
      ]
    }
  ]
};
