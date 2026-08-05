export const ZH = {
  title: '跑酷酷',
  subtitle: 'Q 弹小方块的侧视冒险',
  continueGame: '继续游戏',
  startGame: '开始游戏',
  selectLevel: '选择关卡',
  clearSave: '清除存档',
  shop: '商店',
  back: '返回',
  level: (n: number) => `第 ${n} 关`,
  locked: '未解锁',
  confirmClear: '确定清除全部进度？',
  confirm: '确定',
  cancel: '取消',
  time: '时间',
  deaths: '死亡',
  coins: '金币',
  hp: '生命',
  armor: '护甲',
  armorLost: '护甲 -1',
  hpLost: '生命 -1',
  weapon: '武器',
  skill: '技能',
  bag: '背包',
  bagHint: '点击切换武器 · B 关闭',
  bagEmpty: '还没有武器，去关卡里拾取吧',
  equipped: '已装备',
  unequip: '卸下',
  buy: '购买',
  owned: '已拥有',
  notEnoughCoins: '金币不足',
  shopColors: '颜色',
  shopShapes: '形状',
  shopSkins: '颜色',
  shopSkills: '技能（同时只能装备一个）',
  skinDefault: '经典橙',
  skinSky: '天空蓝',
  skinMint: '薄荷绿',
  skinGrape: '葡萄紫',
  skinSun: '阳光金',
  shapeSquare: '方块',
  shapeRound: '圆滚滚',
  shapeDiamond: '菱形',
  shapeTriangle: '小三角',
  shapePill: '胶囊',
  shapeHex: '六边形',
  skillNone: '无技能',
  skillBlink: '瞬移',
  skillHaste: '加速',
  skillFlight: '飞行',
  skillBlinkDesc: 'K：向前短距瞬移',
  skillHasteDesc: 'K：短时大幅加速',
  skillFlightDesc: 'K：短时自由飞行',
  shopSpecials: '特殊技能（可另装，按 N）',
  special: '特殊',
  specialNone: '无特殊技能',
  specialMissile: '追踪导弹',
  specialMissileDesc: 'N：飞向最近怪并爆炸秒杀',
  specialMissileLv: (
    cdLv: number,
    cdMax: number,
    cdSec: string,
    salvoLv: number,
    salvoMax: number,
    salvoCount: number,
  ) =>
    `冷却 Lv.${cdLv}/${cdMax} ${cdSec}s · 齐射 Lv.${salvoLv}/${salvoMax} 每次${salvoCount}发`,
  specialOrbit: '环绕导弹',
  specialOrbitDesc: 'N：无怪也可发射，长按连续装填，环绕待命，遇敌自动出击',
  specialOrbitLv: (lv: number, max: number, cap: number) =>
    `存储 Lv.${lv}/${max} · 最多环绕 ${cap} 枚`,
  specialUpgrade: (price: number) => `升级 ${price}`,
  specialUpgradeCd: (price: number) => `冷却 ${price}`,
  specialUpgradeSalvo: (price: number) => `齐射 ${price}`,
  specialUpgradeOrbit: (price: number) => `存储 ${price}`,
  specialMaxLevel: '已满级',
  noSpecialEquipped: '未装备特殊技能，去商店看看吧',
  noMissileTarget: '附近没有可锁定的怪兽',
  orbitMissileFull: '环绕导弹已满，先等它们出击吧',
  weaponNone: '徒手',
  weaponGlove: '弹力拳套',
  weaponPeashooter: '弹珠枪',
  weaponHammer: '重锤',
  weaponFireball: '火球术',
  weaponShotgun: '散射弹',
  paused: '已暂停',
  resume: '继续',
  restart: '重新开始',
  backToMenu: '返回菜单',
  adSkip: '看广告跳关',
  adPromoSubtitle: '《跑酷酷》独家精彩推荐 · 看完直达终点领金币',
  adPromoTagline: '跑跳 · 收集 · 变装 · 一气呵成',
  adSlogans: [
    '一颗小方块，也能跳出大世界！',
    '二段跳 + 土狼时间，手感丝滑到犯规',
    '形状随便换，颜色随便搭——你的小人你做主',
    '金币哗哗进账，商店装扮自由选',
    '踩踏、射击、机关齐上阵，闯关绝不无聊',
    '星级挑战：少死、速通，冲三星就现在',
    '卡住了？看完推荐，终点金币一并带走～',
    'Q 弹侧视冒险，下一跳更精彩！',
  ],
  adBursts: ['跳起来！', '金币到账！', '变装时刻！', '冲向终点！'],
  adChipJump: '弹跳手感满满',
  adChipShop: '形状颜色自由搭',
  adChipStars: '星级挑战等你刷',
  adChipWeapons: '武器背包常备',
  adWatching: (sec: number) => `精彩推荐播放中… 还剩 ${sec} 秒`,
  adSkipCoins: (n: number) => `跳关奖励：金币 +${n}`,
  adSkipHint: '观看 30 秒推荐动画，传送终点并收下本关全部金币',
  pipeHint: '按 X 进入挑战管道',
  pipeEnter: '进入怪兽境界！开场 5 秒无敌，清空它们可获 50 金币',
  pipeClear: '挑战成功！金币 +50',
  pipeFail: '挑战失败，管道已关闭',
  pipeSealed: '管道已关闭',
  tryAgain: '再试一次',
  clear: '过关！',
  elapsed: '用时',
  deathCount: '死亡次数',
  rating: '评价',
  nextLevel: '下一关',
  playAgain: '再玩一次',
  controls: 'A/D 移动，空格跳，X 互动，J 攻击，K 技能，N 导弹，B 背包，P 暂停',
  interactBreak: '按 X 破坏',
  interactControl: '按 X 操控',
  brokeBlock: '机关已破坏！',
  toggledDevice: '机关已切换！',
  gotCoin: (n: number) => `金币 +${n}`,
  gotGlove: '获得弹力拳套！已放入背包',
  gotPeashooter: '获得弹珠枪！已放入背包',
  gotHammer: '获得重锤！已放入背包',
  gotFireball: '获得火球术！已放入背包',
  gotShotgun: '获得散射弹！已放入背包',
  alreadyOwned: '已拥有，已切换装备',
  checkpoint: '检查点已激活',
  skillReady: '技能就绪',
  skillCooldown: '技能冷却中',
  noSkillEquipped: '未装备技能，去商店看看吧',
  stars: (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n),
} as const;

export function weaponLabel(
  weapon: 'none' | 'glove' | 'peashooter' | 'hammer' | 'fireball' | 'shotgun',
): string {
  switch (weapon) {
    case 'glove':
      return ZH.weaponGlove;
    case 'peashooter':
      return ZH.weaponPeashooter;
    case 'hammer':
      return ZH.weaponHammer;
    case 'fireball':
      return ZH.weaponFireball;
    case 'shotgun':
      return ZH.weaponShotgun;
    default:
      return ZH.weaponNone;
  }
}

export function weaponPickupToast(
  weapon: 'glove' | 'peashooter' | 'hammer' | 'fireball' | 'shotgun',
): string {
  switch (weapon) {
    case 'glove':
      return ZH.gotGlove;
    case 'peashooter':
      return ZH.gotPeashooter;
    case 'hammer':
      return ZH.gotHammer;
    case 'fireball':
      return ZH.gotFireball;
    case 'shotgun':
      return ZH.gotShotgun;
  }
}

export function skinLabel(id: 'default' | 'sky' | 'mint' | 'grape' | 'sun'): string {
  switch (id) {
    case 'sky':
      return ZH.skinSky;
    case 'mint':
      return ZH.skinMint;
    case 'grape':
      return ZH.skinGrape;
    case 'sun':
      return ZH.skinSun;
    default:
      return ZH.skinDefault;
  }
}

export function shapeLabel(
  id: 'square' | 'round' | 'diamond' | 'triangle' | 'pill' | 'hex',
): string {
  switch (id) {
    case 'round':
      return ZH.shapeRound;
    case 'diamond':
      return ZH.shapeDiamond;
    case 'triangle':
      return ZH.shapeTriangle;
    case 'pill':
      return ZH.shapePill;
    case 'hex':
      return ZH.shapeHex;
    default:
      return ZH.shapeSquare;
  }
}

export function skillLabel(id: 'none' | 'blink' | 'haste' | 'flight'): string {
  switch (id) {
    case 'blink':
      return ZH.skillBlink;
    case 'haste':
      return ZH.skillHaste;
    case 'flight':
      return ZH.skillFlight;
    default:
      return ZH.skillNone;
  }
}

export function skillDesc(id: 'blink' | 'haste' | 'flight'): string {
  switch (id) {
    case 'blink':
      return ZH.skillBlinkDesc;
    case 'haste':
      return ZH.skillHasteDesc;
    case 'flight':
      return ZH.skillFlightDesc;
  }
}

export function specialLabel(id: 'none' | 'missile' | 'orbit'): string {
  switch (id) {
    case 'missile':
      return ZH.specialMissile;
    case 'orbit':
      return ZH.specialOrbit;
    default:
      return ZH.specialNone;
  }
}

export function specialDesc(id: 'missile' | 'orbit'): string {
  switch (id) {
    case 'missile':
      return ZH.specialMissileDesc;
    case 'orbit':
      return ZH.specialOrbitDesc;
  }
}
