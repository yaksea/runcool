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
  tryAgain: '再试一次',
  clear: '过关！',
  elapsed: '用时',
  deathCount: '死亡次数',
  rating: '评价',
  nextLevel: '下一关',
  playAgain: '再玩一次',
  controls: 'A/D 移动，空格跳，X 互动，J 攻击，K 技能，B 背包，P 暂停',
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
