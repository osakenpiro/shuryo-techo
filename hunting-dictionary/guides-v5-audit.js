/* Final source reconciliation, applied before search indexes are built. */
(()=>{'use strict';const D=window.HUNTING_DICTIONARY;if(D?.version!=='0.5.0')throw Error('Missing v0.5 routes');
const entries=new Map(D.entries.map(e=>[e.id,e]));
const refs={g_cleanser_base:['攻略レシピ｜解除の煙筒の入手','https://mhwg.org/ida/228517.html'],g_cleanser_quest:['Game8｜捕獲：毒と麻痺の番の前提','https://game8.jp/mhw/290154'],g_health_base:['攻略レシピ｜癒しの煙筒の入手','https://mhwg.org/ida/667.html'],g_health_quest:['Game8｜華やかなりしクイーンズの前提','https://game8.jp/mhw/290164'],g_vitality_route:['Game8｜体力の装衣の前提','https://game8.jp/mhw/198708'],g_evasion_base:['Game8｜回避の装衣の入手条件','https://game8.jp/mhw/202100'],g_impact_base:['Game8｜強打の装衣の入手条件','https://game8.jp/mhw/202290'],g_apothecary_base:['Game8｜胸をよぎる荒天の予感の条件','https://game8.jp/mhw/205170'],g_immunity_base:['Game8｜熱砂の陽炎の条件','https://game8.jp/mhw/205168']};
for(const [id,[label,url]] of Object.entries(refs))D.sources[id]={label,url,evidence:'攻略資料の条件照合'};
const cleanser=entries.get('booster-cleanser');
cleanser.scope='煙筒／改M★2・MR4以上';
cleanser.guide=[{title:'通常版',steps:['フリー★4「羽ばたく悪夢」をクリアして受領。任務「飛べ、パオウルムー！」とは別クエスト。']},{title:'改への強化',steps:['解除の煙筒を所持し、任務M★2「氷土の番人トビカガチ亜種」をクリア。','セリエナの武具屋へ。M★2「捕獲：毒と麻痺の番」でトビカガチ亜種を捕獲。']}];
cleanser.sources=['g_cleanser_base','g_cleanser_quest'];
const health=entries.get('booster-health');
health.guide=[{title:'通常版',steps:['任務★4「ゾラ・マグダラオス捕獲作戦」をクリアして受領。']},{title:'改への強化',steps:['M★2「珊瑚の陸に春来たる」をクリア。','M★2「陸の女王リオレイアの溜息」または「女王様の優雅な一日」をクリア。','セリエナの武具屋へ。M★2「華やかなりしクイーンズ」で2頭を狩猟。']}];
health.sources=['g_health_base','g_health_quest'];
const vitality=entries.get('mantle-vitality');
vitality.title='体力の装衣：通常版とビッグホーン';
vitality.guide=[{title:'初入手',steps:['★5へ進行し、古代樹の森の探索で古代竜人を発見。アステラの武具屋で受領を確認。']},{title:'改への強化',steps:['体力の装衣を所持し、任務M★2「氷土の番人トビカガチ亜種」をクリア。','M★1「捕獲：雪の下にも三年」を完了。','セリエナの武具屋へ。M★1「ビッグホーン・クラッシャー！」でバフバロを狩猟。']}];
vitality.related=['mantle-ghillie','mantles-route'];vitality.sources=['g_vitality_route'];
for(const [id,source] of [['mantle-evasion','g_evasion_base'],['mantle-impact','g_impact_base'],['mantle-apothecary','g_apothecary_base'],['mantle-immunity','g_immunity_base']]){const e=entries.get(id);e.sources=e.sources.filter(x=>x!=='g_base');e.sources.unshift(source);}
D.guideReview={revision:'0.5-source-reconciliation-1',date:'2026-09-20',gameClientTested:false};
})();
