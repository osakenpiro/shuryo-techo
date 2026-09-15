window.MH_PORTAL_DATA = {
  titles: {
    mhwib: {
      short: "MHW:I",
      name: "ICEBORNE",
      subtitle: "モンスターハンター：ワールド ── アイスボーン",
      status: "進行中",
      progress: "MR攻略中 / 目標：ミラボレアス",
      next: "IBクリア → Wilds",
      tone: "red",
      weapons: ["スラッシュアックス"],
      practice: ["弓", "チャージアックス"],
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
      weapons: ["ガンランス", "ハンマー"],
      practice: [],
      note: "ワイルズでの持ち武器へ戻るための、次の表紙。入口だけ先に作っておく。",
      href: "#titles",
      action: "次の狩場を確認"
    },
    rise: {
      short: "RISE",
      name: "RISE / SB",
      subtitle: "モンスターハンターライズ：サンブレイク",
      status: "履歴",
      progress: "プレイ済み / 武器の原点",
      next: "過去の持ち武器を確認",
      tone: "indigo",
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
