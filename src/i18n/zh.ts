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
  weaponNone: '徒手',
  weaponGlove: '弹力拳套',
  weaponPeashooter: '弹珠枪',
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
  controls: '方向键或 A/D 移动，空格跳跃，J 攻击，P 暂停',
  gotGlove: '获得弹力拳套！',
  gotPeashooter: '获得弹珠枪！',
  checkpoint: '检查点已激活',
  stars: (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n),
} as const;

export function weaponLabel(weapon: 'none' | 'glove' | 'peashooter'): string {
  if (weapon === 'glove') return ZH.weaponGlove;
  if (weapon === 'peashooter') return ZH.weaponPeashooter;
  return ZH.weaponNone;
}
