/* Candidate-only, versioned app snapshot. Regenerate with node scripts/build-pwa.mjs. */
'use strict';
// BEGIN GENERATED PRECACHE
const PRECACHE_VERSION = "20261018-28261c9f264420c72f25";
const PRECACHE_ASSETS = [
  {
    "url": "./app.css",
    "sha256": "26b61775518c23dcea6bfbe545b46cff23285886509e0b328bfec53945fc4045"
  },
  {
    "url": "./art/advanced/20261013/eccentric-basket.png",
    "sha256": "7cd789b9073bd758064d5b59529a37f401791a69e4fdf9d84813eed8d4773248"
  },
  {
    "url": "./art/advanced/20261013/eccentric-boar.png",
    "sha256": "81cbb4d8b4a972b520a320e065f7fa0be77b84fd3bfa474e591773e927b4887c"
  },
  {
    "url": "./art/advanced/20261013/eccentric-cannon.png",
    "sha256": "13cce89ac52adf90be79fce20ebec3f2e7c5336a425bfde09409c9107a5fc125"
  },
  {
    "url": "./art/advanced/20261013/eccentric-card.png",
    "sha256": "3623596991848142b696a3d6e42b3a66a15dcb31f55afcd33215b4c4b8236187"
  },
  {
    "url": "./art/advanced/20261013/eccentric-dandelion.png",
    "sha256": "78951b31991afcc9ffdf45d4da2af9e4dc7471d8d57de200cd827efbf1efd032"
  },
  {
    "url": "./art/advanced/20261013/eccentric-tower.png",
    "sha256": "dce5107096c0daac419945b0d24356a162f8d03d5c42e6324336edcf897ef01e"
  },
  {
    "url": "./art/advanced/20261013/eccentric-train.png",
    "sha256": "c0d3236408f89399f2d73d8292051313669ee3f6c320ac68323296b870cc2ca1"
  },
  {
    "url": "./art/advanced/20261013/factory-bank.png",
    "sha256": "791cec1f481c5d2b8f1fe6478e10bd69496640059536166d07734da7dbeb695f"
  },
  {
    "url": "./art/advanced/20261013/factory-conveyor.png",
    "sha256": "27991ae692ac27eb9a1536737dbf4e5c49768ac83eafbc1ee8875e9f4ed31386"
  },
  {
    "url": "./art/advanced/20261013/factory-relay.png",
    "sha256": "d2454e22bbaf16921bd9abd104602bc7adeee773c3feae947cb5347c4cdc6dc8"
  },
  {
    "url": "./art/advanced/20261013/factory-shutter.png",
    "sha256": "258f102d3d951fdcffe14de209dfd1ebe0eb67a45baa9bd6960fd58ba7c80774"
  },
  {
    "url": "./art/concept/20261011/room-three-faces.png",
    "sha256": "a4629b6b93c019509dbf5c346e2f57c119caa6800f7e4621a7fa0924aa7eb26e"
  },
  {
    "url": "./art/outdoor/20261012/outdoor-baseball.png",
    "sha256": "7f0f77790e51b5580fffa43b3393650f636a41d5bba3fd110fbaaf3ed45aa563"
  },
  {
    "url": "./art/outdoor/20261012/outdoor-mall.png",
    "sha256": "aa4966d73392cd21ab1ad537d2328b83907df72b83257bc7f3a31cef022f38bb"
  },
  {
    "url": "./art/outdoor/20261012/outdoor-river.png",
    "sha256": "cfdae8b366eb88bf52e41d34fd29ce4ca4e989c209b5f9ea9df352cd644fc2be"
  },
  {
    "url": "./art/outdoor/20261012/outdoor-shrine.png",
    "sha256": "0ed5ae54ab5e03b6a12c1f1921c461858903337c896b70e8c17a2ea1a2872d26"
  },
  {
    "url": "./art/school/20261011/school-classroom.png?v=20261015-boar-distance-1",
    "sha256": "1a433a7babd046f85806198334144138d86e13b29b68cb8ce0cce2b565817cf0"
  },
  {
    "url": "./art/school/20261011/school-passage.png?v=20261015-boar-distance-1",
    "sha256": "722eba1fdde7fd9c97d5af68c84ca1bc4773bbac1ae1f9b2d06f48e576346c18"
  },
  {
    "url": "./art/school/20261011/school-rooftop.png?v=20261015-boar-distance-1",
    "sha256": "85a6fab422efb1c0215560ec9b69f5b68159dcc7564943a8605b0fc6a0d890a9"
  },
  {
    "url": "./art/school/20261011/school-vending.png?v=20261015-boar-distance-1",
    "sha256": "17033dad1d2fc35cfb5a1b37bfc0c4ff5a2bd5f7dc15383076a08c03eb8a6e20"
  },
  {
    "url": "./art/stage-cards/20261014/cards-cannon.png?v=20261015-boar-distance-1",
    "sha256": "1402f1764afc0b4f818f956457266f80ac1fadef50a04499030294f741f08b81"
  },
  {
    "url": "./art/stage-cards/20261014/factory-eccentric.png?v=20261015-boar-distance-1",
    "sha256": "03313122cd83796e2056512dfa29f476c91f30d3a562f6d881a02ab49c837416"
  },
  {
    "url": "./art/stage-cards/20261014/outdoor-factory.png?v=20261015-boar-distance-1",
    "sha256": "7fcd2e846fd98c181ce6bf03dd74fa0e8278f57fdbb7808469996ad2a95511c7"
  },
  {
    "url": "./art/stage-cards/20261014/room-school.png?v=20261015-boar-distance-1",
    "sha256": "105496bce3451deb0180dfddea1fec5bdf3c8e07f0e0f49dccec8071e778b117"
  },
  {
    "url": "./art/stage-cards/20261014/train-window.png?v=20261015-boar-distance-1",
    "sha256": "239bfe5ba1c9e94282dc4f9e219d295ecedf41d8583e6c261e1494dd852a9aa3"
  },
  {
    "url": "./art/store/20261011/store-workbench-background.png",
    "sha256": "abf065d359a427e9bca39a9ce3722d2309e1a1874ab7cd12b0195fe2e2dc2f3f"
  },
  {
    "url": "./art/title/20261011/title-room.png",
    "sha256": "b684b8a3dcb8b3cf1c8ea8f5567044435b98b538117e2e95ed9ffdc66c6efba4"
  },
  {
    "url": "./icons/apple-touch-icon.png",
    "sha256": "f95b801e24588a2a5c59d78c2d0dd574ce9c17fccea177394598dc4e0c40782e"
  },
  {
    "url": "./icons/icon-192.png",
    "sha256": "9c85a55a72db60ad83ecd860a919538c629ff3f73c7a26f051653c503a873a06"
  },
  {
    "url": "./icons/icon-512.png",
    "sha256": "2498af74796e42686e92b9daca64985bd2c0162ac1ce269ab7657e91b5944d5f"
  },
  {
    "url": "./icons/icon.svg",
    "sha256": "80bcfe821b82c9fb6231ac0246befb6eefffe72196eb2c669ccc01bdc838dd93"
  },
  {
    "url": "./icons/maskable-512.png",
    "sha256": "e4f01dc5afcd73cc99d33c2666320a9ba2db7ca5ce2a6f51474ecaa5235a0888"
  },
  {
    "url": "./index.html",
    "sha256": "e9b12e853636dae5ac5728a3a732e298e8bbdf3ac724e2519dc5244a847b5af1"
  },
  {
    "url": "./manifest.webmanifest",
    "sha256": "0a6d5f2d8e421ac4476dcf03e0a3628eadbba58eebe1844177814a3c93ad2212"
  },
  {
    "url": "./mobile-results.css",
    "sha256": "4dc9417da4a1e0402e7e8cc61f0ee616bb6bd3005700bb778b88f2d24f094414"
  },
  {
    "url": "./src/advanced-replay.mjs?v=20261015-boar-distance-1",
    "sha256": "aea0ff3ff65b25378e1d8071c9c20cd6ef91c71d71c6905cdd41754095ddb66f"
  },
  {
    "url": "./src/app-entry.mjs",
    "sha256": "8cbafd78164b595ed1e051474bec4bcc855e93c82843a0dddab61de3632b7c91"
  },
  {
    "url": "./src/app-install.mjs",
    "sha256": "a94b65585a127f6805405f1d673cfdaa38c3aa9543c0e7fea41621d12fe8a53d"
  },
  {
    "url": "./src/app.mjs?v=20261015-boar-distance-1",
    "sha256": "4a41de447b593940a98f0c8bd61067ce728b90349c1d67112288ecf7c32108ec"
  },
  {
    "url": "./src/ballpark-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "717fcdcb2eaa316edc1afa314af7d825ecd0a1f584821728749419b43cbb50cd"
  },
  {
    "url": "./src/baseball-intro.mjs?v=20261015-boar-distance-1",
    "sha256": "143837618c57ba74b9882cb48b6a5cd310e2cf43f595e291563d7b0126ae2bb7"
  },
  {
    "url": "./src/course-replay.mjs?v=20261015-boar-distance-1",
    "sha256": "e189153dfa967c1b553e48d2ab57a0fb559ef1ab26202b28b657e39c2955e40c"
  },
  {
    "url": "./src/eccentric-play.mjs?v=20261015-boar-distance-1",
    "sha256": "649118aa4c50bd146f5884809f4e590e23d317f77a0e0835fe01157ae07f3a73"
  },
  {
    "url": "./src/eccentric-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "533cc94b8521e78debe8b3c0db52125aeda1fab43d62252e749dd4e886272aab"
  },
  {
    "url": "./src/eccentric-showcase-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "5a59f8a7ebfb95e7a3bd75cd0451a01749d5fe9cdc16de42dc7334cf5c210cc8"
  },
  {
    "url": "./src/eccentric-world.mjs?v=20261015-boar-distance-1",
    "sha256": "06a498513224a6820b123ef7899b23a793ebd15250eff3b8b1103dc28a844502"
  },
  {
    "url": "./src/factory-environment.mjs?v=20261015-boar-distance-1",
    "sha256": "596b965a2cf2044b3068fd8a0de2aaa8b3e545aec6db6529924a078c6cd8877c"
  },
  {
    "url": "./src/factory-machinery.mjs?v=20261015-boar-distance-1",
    "sha256": "28fd2c4fac86c43361a6a21470f2813e4dbe2130038bd2ce9bb002023a398ec0"
  },
  {
    "url": "./src/factory-play.mjs?v=20261015-boar-distance-1",
    "sha256": "7dbeb982ec17e9e819b380abd9b8aa6f8ad2c75307a2b8e4473608c0b9714321"
  },
  {
    "url": "./src/factory-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "5023f4a34ea64fa5451474047a9868d4f8130e684a9c950c1f62e54d320b3aa2"
  },
  {
    "url": "./src/factory-world.mjs?v=20261015-boar-distance-1",
    "sha256": "24fffa99c09acfa56e92660c96231c8d34bc7b220691ded97b3173d6b27f09d0"
  },
  {
    "url": "./src/forest-hunt-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "d0d5af49da494b2a06420bb4842a1985d6562a4e531a32e98b94dc4fac82fdb3"
  },
  {
    "url": "./src/friend-match.mjs",
    "sha256": "50790babe35dda80fef948e62baab287849500a16d4d44396f0f01072c6ae0eb"
  },
  {
    "url": "./src/game-menu.mjs?v=20261015-boar-distance-1",
    "sha256": "7fc2238ef175f81d3cfa24e18d37e52c532156188225f18e1c7feb139895bcda"
  },
  {
    "url": "./src/game-shell.mjs?v=20261015-boar-distance-1",
    "sha256": "a5e2eea5aa167350f72dfdbf1f673e6dec660b63fea628d5fc3c8dca51256cf0"
  },
  {
    "url": "./src/goal-cue.mjs?v=20261015-boar-distance-1",
    "sha256": "16807ed2561233c0c2c26095b4ee1772932dc56a1f986afebfe78cf0a101cc09"
  },
  {
    "url": "./src/gym-basket-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "ecbcd74cf6e79161f41747322097af49c6032da49f3e3ad54aea1da6ccaaaf5c"
  },
  {
    "url": "./src/item-replay.mjs?v=20261015-boar-distance-1",
    "sha256": "c4230b6c680507068265bb7dd92687689185c35d8c4608b45a967b8b7b3aab75"
  },
  {
    "url": "./src/item-store.mjs?v=20261015-boar-distance-1",
    "sha256": "808d123077c5afe46b8f594cde051874970ea9e8c13b5e1d6e23562a5950948a"
  },
  {
    "url": "./src/mall-physical-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "6b7830edaecc904a6ea61cda356e20514e2c13f3cbc71087c33e231b445b50e0"
  },
  {
    "url": "./src/outdoor-architecture.mjs?v=20261015-boar-distance-1",
    "sha256": "a73b4570ce2b136e6bae8c913cd7bcd0eb55c635b8b613945e15ce609c3021ce"
  },
  {
    "url": "./src/outdoor-effects.mjs?v=20261015-boar-distance-1",
    "sha256": "17c3582d6bb345aa37b5ccdad85c63d4b7e7814e0a14c2ac700bc7253c6b7f7c"
  },
  {
    "url": "./src/outdoor-play.mjs?v=20261015-boar-distance-1",
    "sha256": "54842de1df847c80c5ecface7e4855013a4d2cbd6444ab9b2bd929132c4401a2"
  },
  {
    "url": "./src/outdoor-progress.mjs?v=20261015-boar-distance-1",
    "sha256": "ca7f20ae9cccae21c523ffcb61249f5bdc2e450c25208005540237809c1d3d9b"
  },
  {
    "url": "./src/outdoor-replay.mjs?v=20261015-boar-distance-1",
    "sha256": "07c4e694d10a9649b486cbf8614e6dcda89c4333125cc9682c61f922be761799"
  },
  {
    "url": "./src/outdoor-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "2f0e3ecd8e9cfcaa63f8aabf441fa51f4113307f40d0f39dbebece57637a3653"
  },
  {
    "url": "./src/outdoor-world.mjs?v=20261015-boar-distance-1",
    "sha256": "eec3fc328fcb29c1c7ce448cbe315f33d56424995e8f123b20e9539c2e290d89"
  },
  {
    "url": "./src/physics.mjs?v=20261015-boar-distance-1",
    "sha256": "4ea15937a7dca2c6d608fd29c30c176d5136da1f1b7d5efa06b59c7189925562"
  },
  {
    "url": "./src/pixel-intro.mjs?v=20261015-boar-distance-1",
    "sha256": "de4a914142e4630272b84260961569e126edac3a668919ac52aa90908a4d380f"
  },
  {
    "url": "./src/pixel-type.mjs?v=20261015-boar-distance-1",
    "sha256": "df81ebda761f046ffbead1c39390301c3dd908a207f453cfce2b2b5a97ed1475"
  },
  {
    "url": "./src/play-cue.mjs?v=20261015-boar-distance-1",
    "sha256": "352286e10868f064771d725b82e0576e5fb592a5d7996d352d0d03e23bc07419"
  },
  {
    "url": "./src/play-replay.mjs?v=20261015-boar-distance-1",
    "sha256": "d0383598552c7e7be1c17f42f5520308b288513a50833a18b628ff792612fc07"
  },
  {
    "url": "./src/play-room.mjs?v=20261015-boar-distance-1",
    "sha256": "e9503ae1f392f04a0bc74d06408c717b61c2a78d4fb829b19d4136b9f7b7d901"
  },
  {
    "url": "./src/player-save-ui.mjs?v=20261015-boar-distance-1",
    "sha256": "02685e01c4e1b45e01cafbd3d2909c51b2beb3b0b496848c9c5762d95825fc28"
  },
  {
    "url": "./src/player-save.mjs?v=20261015-boar-distance-1",
    "sha256": "595a008cb494b84956cebf54ed0e8d609062c753b970a73e5d279204a0910cd1"
  },
  {
    "url": "./src/preview-storage.mjs?v=20261015-boar-distance-1",
    "sha256": "51033c244883d54aff9ac9faeed9417c659527a4492f7769905f52bf558ad9ae"
  },
  {
    "url": "./src/progress-save.mjs?v=20261015-boar-distance-1",
    "sha256": "76a474edb64f222045971b352e7456d3b44a04ddb1d535da71db30f69802b846"
  },
  {
    "url": "./src/pull-cue.mjs?v=20261015-boar-distance-1",
    "sha256": "c3241e261c1910161821f90eb7055fd85d73e3dd1740d22d6d40182ee68f8b75"
  },
  {
    "url": "./src/pull-feel.mjs?v=20261015-boar-distance-1",
    "sha256": "744c0d94ee13faeb639045ea7d867bb31894575b843c3463060bf8b52a40549a"
  },
  {
    "url": "./src/pull-scale.mjs?v=20261015-boar-distance-1",
    "sha256": "542f9db500b5f488f5ef01efbcc03b3b786e3d94458b283360cf143137f8f16f"
  },
  {
    "url": "./src/quick-retry.mjs?v=20261015-boar-distance-1",
    "sha256": "5e2826d16747a09c22869d2c2821c8e78799b6f243d372a2090763e801b279ed"
  },
  {
    "url": "./src/release-chapters-play.mjs",
    "sha256": "f34ae20df6b370a022df715de2d427cdb48b0122d32c29e106d95ce4b957246b"
  },
  {
    "url": "./src/release-chapters-replay.mjs",
    "sha256": "e0251be1ee665fd11f6ec2b0202831c8ae6cc10d40ece31c59255100363f10b6"
  },
  {
    "url": "./src/release-chapters-replay.mjs?v=20261018-chapters67-1",
    "sha256": "e0251be1ee665fd11f6ec2b0202831c8ae6cc10d40ece31c59255100363f10b6"
  },
  {
    "url": "./src/release-chapters-scene.mjs",
    "sha256": "7b029d10eab361f91ced1aceb44c34ef2081776aa5647357a661855cefdea587"
  },
  {
    "url": "./src/release-chapters-world.mjs",
    "sha256": "aaff2d0daae25ef9b8845757e4aff77767835ab40e23fd03cdacf33152b61142"
  },
  {
    "url": "./src/release-chapters-world.mjs?v=20261018-chapters67-1",
    "sha256": "aaff2d0daae25ef9b8845757e4aff77767835ab40e23fd03cdacf33152b61142"
  },
  {
    "url": "./src/render.mjs?v=20261015-boar-distance-1",
    "sha256": "aaed2ea5756b62eb636b295d888ab4f6825765d385cb9e226ad0051a7d9302e4"
  },
  {
    "url": "./src/replay.mjs?v=20261015-boar-distance-1",
    "sha256": "73b01b394e71375a573b2b2526a57e048728473e507811a6eae6152b06510e4f"
  },
  {
    "url": "./src/reward-effects.mjs?v=20261015-boar-distance-1",
    "sha256": "9fbf5b943a0419cefdd93ad515cd7ae4a549a242a09321e0b7149d2da4fe7d00"
  },
  {
    "url": "./src/rewards.mjs?v=20261015-boar-distance-1",
    "sha256": "544ed31c95e1f36ec6d9b40823fe9ce680281afcac1fa48cd7c49525e41c957b"
  },
  {
    "url": "./src/river-physical-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "52bea6ec867aa70939fe1d17a39768affcc997d9ec916260bcf72ff53f5fb4c3"
  },
  {
    "url": "./src/room-contact.mjs?v=20261015-boar-distance-1",
    "sha256": "571bc6a844bba1ffc11b00c1d11a8d77203b42e5f7af3b738caa1b9e1932503c"
  },
  {
    "url": "./src/room-course.mjs?v=20261015-boar-distance-1",
    "sha256": "d6ee7f2eced61e23a92de045778ca31c652c6e71ebd57d2eb2ab57ef5188537a"
  },
  {
    "url": "./src/room-gimmicks.mjs?v=20261015-boar-distance-1",
    "sha256": "4aaf2e55c821bfdd0ec5bfe08fb87689025bbbcc8f87a73f07bfbc684957007c"
  },
  {
    "url": "./src/room-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "4ef0ce071357140af2bddce9442b4c84836cfdf13abc981a52f131001ef12847"
  },
  {
    "url": "./src/room-solids.mjs?v=20261015-boar-distance-1",
    "sha256": "5af44cd7db3a0e755afb7f8c0558e62d8f93fffaa354e4fea6dcc5bcd37a7b3c"
  },
  {
    "url": "./src/school-play.mjs?v=20261015-boar-distance-1",
    "sha256": "75ee686d7031f37559370b933f5d0111ac80f30fd444bd1922173f3e9d330ce2"
  },
  {
    "url": "./src/school-replay.mjs?v=20261015-boar-distance-1",
    "sha256": "97cdeaefb82d104caaab9f4a130f59da9a84479d7bbbd7b9c31a4a7bd8361b31"
  },
  {
    "url": "./src/school-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "dec6e44bcf08bd7d60d0eef33acf000b8afe517cb29188697956a97cf8f484fd"
  },
  {
    "url": "./src/school-world.mjs?v=20261015-boar-distance-1",
    "sha256": "91adb3c892b9dc22dbc920a9867700e82363a7b984bc4b891b1c5ae5f8003424"
  },
  {
    "url": "./src/shot-analytics.mjs?v=20261015-boar-distance-1",
    "sha256": "dfd8b9d9f4b568f5b54e416afcf0b2255d02d2011bbc7019015fd6f6171cebcd"
  },
  {
    "url": "./src/shot-summary.mjs?v=20261015-boar-distance-1",
    "sha256": "031be30769df1e3b789fb7d1715f64003eecc83e2b422427fcbe2595353f348b"
  },
  {
    "url": "./src/side-aim.mjs?v=20261015-boar-distance-1",
    "sha256": "b565ce26ec6976960d1d8c1a6686ade78eab2531d40eded7cb96ea588d0f0920"
  },
  {
    "url": "./src/slash-throw.mjs",
    "sha256": "1f9fcd761cd22980d5d5d0bf47633289b6b754d418596b140a1984506bce5bf1"
  },
  {
    "url": "./src/stages.mjs?v=20261015-boar-distance-1",
    "sha256": "f4652cd0f3577c5c422b13a796bfd852ee934262abfb34b39aa2eda23ec781f3"
  },
  {
    "url": "./src/throwable-physics.mjs?v=20261015-boar-distance-1",
    "sha256": "d1a8e364ebd674f24cf8b8d76d76ebe9777fcdf6d242c2e19a2cbda006bba097"
  },
  {
    "url": "./src/throwable-world-profile.mjs?v=20261015-boar-distance-1",
    "sha256": "09619c2a5399e315ed47c2ec151ec43dc478d652fc38d4428b0d8b02c761259d"
  },
  {
    "url": "./src/throwables.mjs?v=20261015-boar-distance-1",
    "sha256": "808dca57521623f4c0c722c66456e284b90cff7a7708eda7b37033da0f934ac5"
  },
  {
    "url": "./src/title-screen.mjs?v=20261015-boar-distance-1",
    "sha256": "fd8f973ac28915f4869faf08ac8cb6e5ef303336e88d5547ddd599b723f83fd6"
  },
  {
    "url": "./src/tokyo-tower-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "a22b3d449f1390b000a2746685a81d1418fba39616a005f52f2b844885d910dc"
  },
  {
    "url": "./src/train-window-scene.mjs?v=20261015-boar-distance-1",
    "sha256": "8e046d24dcdf51db8cd9528d1d14bb7a7e9accbacc65732451b5deb78cbc0078"
  },
  {
    "url": "./style.css?v=20261015-boar-distance-1",
    "sha256": "1bfdc53c9b45a2bda014eb821f217a9145e9a07a6e1178d02dadac8ab9e669fa"
  }
];
// END GENERATED PRECACHE

const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `trashoot-candidate-20261018:${encodeURIComponent(SCOPE.pathname)}:`;
const CACHE_NAME = CACHE_PREFIX + PRECACHE_VERSION;
const SHELL_URL = new URL('./index.html', SCOPE).href;
const ASSET_URLS = new Set(PRECACHE_ASSETS.map(asset => new URL(asset.url, SCOPE).href));

function insideScope(url) {
  return url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);
}
function entryNavigation(url) {
  return insideScope(url) && (url.pathname === SCOPE.pathname || url.pathname === new URL('./index.html', SCOPE).pathname);
}
async function digest(response) {
  const bytes = await response.clone().arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      if (!PRECACHE_ASSETS.length) throw new Error('PWA asset list has not been built');
      await Promise.all(PRECACHE_ASSETS.map(async asset => {
        const url = new URL(asset.url, SCOPE);
        if (!insideScope(url)) throw new Error('Precache escaped candidate scope');
        const response = await fetch(new Request(url, {cache: 'reload', credentials: 'same-origin'}));
        if (!response.ok || response.type === 'opaque' || (response.url && response.url !== url.href)) throw new Error('Precache fetch failed');
        if (await digest(response) !== asset.sha256) throw new Error('Precache content changed; rebuild required');
        await cache.put(url.href, response);
      }));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
    // A replacement waits. Only the explicit update action may activate it.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!insideScope(url)) return;
  // Only the two actual static entry paths share HTML across client-side query
  // options. Asset queries remain exact: ?v=A must never answer ?v=B.
  const key = request.mode === 'navigate' && entryNavigation(url) ? SHELL_URL : url.href;
  if (!ASSET_URLS.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(key) || fetch(request);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'TRASHOOT_ACTIVATE_UPDATE' || event.data?.idle !== true || !event.source?.id) return;
  event.waitUntil((async () => {
    const source = await self.clients.get(event.source.id);
    if (!source || !entryNavigation(new URL(source.url))) return;
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    const candidateWindows = windows.filter(client => entryNavigation(new URL(client.url)));
    // Another tab may have a shot in flight. Do not replace its worker.
    if (candidateWindows.some(client => client.id !== source.id)) {
      source.postMessage({type: 'TRASHOOT_UPDATE_BLOCKED', reason: 'other-windows'});
      return;
    }
    source.postMessage({type: 'TRASHOOT_UPDATE_ACCEPTED'});
    await self.skipWaiting();
  })());
});
