export const ZH = {
  title: '跑酷酷',
  subtitle: 'Q 弹小方块的侧视冒险',
  continueGame: '继续游戏',
  startGame: '开始游戏',
  selectLevel: '选择关卡',
  clearSave: '清除存档',
  back: '返回',
  level: (n: number) => `第 ${n} 关`,
  locked: '未解锁',
  confirmClear: '确定清除全部进度？',
  confirm: '确定',
  cancel: '取消',
  time: '时间',
  deaths: '死亡',
  weapon: '武器',
  bag: '背包',
  bagHint: '点击切换武器 · B 关闭',
  bagEmpty: '还没有武器，去关卡里拾取吧',
  equipped: '已装备',
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
  controls: 'A/D 移动，空格跳跃，W/↑↓ 爬梯，J 攻击，B 背包，P 暂停',
  gotGlove: '获得弹力拳套！已放入背包',
  gotPeashooter: '获得弹珠枪！已放入背包',
  gotHammer: '获得重锤！已放入背包',
  gotFireball: '获得火球术！已放入背包',
  gotShotgun: '获得散射弹！已放入背包',
  alreadyOwned: '已拥有，已切换装备',
  checkpoint: '检查点已激活',
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
