import type { EnemyType, LevelDef } from '../levels/types';
import { ZH } from '../i18n/zh';

export type TutorialZone = {
  id: string;
  x: number;
  y: number;
  radius: number;
  title: string;
  body: string;
};

type Tip = { title: string; body: string };

const TIPS = {
  controls: {
    title: ZH.tipControlsTitle,
    body: ZH.tipControlsBody,
  },
  spike: { title: ZH.tipSpikeTitle, body: ZH.tipSpikeBody },
  pad: { title: ZH.tipPadTitle, body: ZH.tipPadBody },
  ladder: { title: ZH.tipLadderTitle, body: ZH.tipLadderBody },
  checkpoint: { title: ZH.tipCheckpointTitle, body: ZH.tipCheckpointBody },
  coin: { title: ZH.tipCoinTitle, body: ZH.tipCoinBody },
  finish: { title: ZH.tipFinishTitle, body: ZH.tipFinishBody },
  pipe: { title: ZH.tipPipeTitle, body: ZH.tipPipeBody },
  conveyor: { title: ZH.tipConveyorTitle, body: ZH.tipConveyorBody },
  fan: { title: ZH.tipFanTitle, body: ZH.tipFanBody },
  gate: { title: ZH.tipGateTitle, body: ZH.tipGateBody },
  lever: { title: ZH.tipLeverTitle, body: ZH.tipLeverBody },
  breakable: { title: ZH.tipBreakableTitle, body: ZH.tipBreakableBody },
  crumble: { title: ZH.tipCrumbleTitle, body: ZH.tipCrumbleBody },
  seesaw: { title: ZH.tipSeesawTitle, body: ZH.tipSeesawBody },
  bumper: { title: ZH.tipBumperTitle, body: ZH.tipBumperBody },
  moving: { title: ZH.tipMovingTitle, body: ZH.tipMovingBody },
  timed: { title: ZH.tipTimedTitle, body: ZH.tipTimedBody },
  geyser: { title: ZH.tipGeyserTitle, body: ZH.tipGeyserBody },
  flame: { title: ZH.tipFlameVentTitle, body: ZH.tipFlameVentBody },
  acid: { title: ZH.tipAcidPoolTitle, body: ZH.tipAcidPoolBody },
  portal: { title: ZH.tipPortalTitle, body: ZH.tipPortalBody },
  weapon_glove: { title: ZH.tipWeaponGloveTitle, body: ZH.tipWeaponGloveBody },
  weapon_peashooter: { title: ZH.tipWeaponPeaTitle, body: ZH.tipWeaponPeaBody },
  weapon_hammer: { title: ZH.tipWeaponHammerTitle, body: ZH.tipWeaponHammerBody },
  weapon_fireball: { title: ZH.tipWeaponFireTitle, body: ZH.tipWeaponFireBody },
  weapon_shotgun: { title: ZH.tipWeaponShotTitle, body: ZH.tipWeaponShotBody },
  enemy_slime: { title: ZH.tipEnemySlimeTitle, body: ZH.tipEnemySlimeBody },
  enemy_spikeball: { title: ZH.tipEnemySpikeballTitle, body: ZH.tipEnemySpikeballBody },
  enemy_floater: { title: ZH.tipEnemyFloaterTitle, body: ZH.tipEnemyFloaterBody },
  enemy_hopper: { title: ZH.tipEnemyHopperTitle, body: ZH.tipEnemyHopperBody },
  enemy_tank: { title: ZH.tipEnemyTankTitle, body: ZH.tipEnemyTankBody },
  enemy_chaser: { title: ZH.tipEnemyChaserTitle, body: ZH.tipEnemyChaserBody },
  enemy_bat: { title: ZH.tipEnemyBatTitle, body: ZH.tipEnemyBatBody },
  enemy_roller: { title: ZH.tipEnemyRollerTitle, body: ZH.tipEnemyRollerBody },
  enemy_ghost: { title: ZH.tipEnemyGhostTitle, body: ZH.tipEnemyGhostBody },
  enemy_spitter: { title: ZH.tipEnemySpitterTitle, body: ZH.tipEnemySpitterBody },
} as const satisfies Record<string, Tip>;

function zone(id: keyof typeof TIPS, x: number, y: number, radius = 110): TutorialZone {
  const tip = TIPS[id];
  return { id, x, y, radius, title: tip.title, body: tip.body };
}

/** Build proximity tip zones from a tutorial level's placed content. */
export function buildTutorialZones(level: LevelDef): TutorialZone[] {
  const zones: TutorialZone[] = [
    zone('controls', level.playerStart.x + 40, level.playerStart.y, 140),
    zone('finish', level.finish.x, level.finish.y, 120),
  ];

  for (const s of level.spikes) {
    zones.push(zone('spike', s.x + s.count * 14, s.y - 10, 100));
  }
  for (const p of level.pads) zones.push(zone('pad', p.x, p.y, 100));
  for (const l of level.ladders ?? []) {
    zones.push(zone('ladder', l.x + l.w / 2, l.y + l.h / 2, 100));
  }
  for (const c of level.checkpoints) zones.push(zone('checkpoint', c.x, c.y, 100));
  for (const c of level.coins ?? []) zones.push(zone('coin', c.x, c.y, 80));
  if (level.pipe) zones.push(zone('pipe', level.pipe.x, level.pipe.y - 40, 120));

  for (const c of level.conveyors ?? []) {
    zones.push(zone('conveyor', c.x + c.w / 2, c.y, 110));
  }
  for (const f of level.fans ?? []) {
    zones.push(zone('fan', f.x + f.w / 2, f.y + f.h / 2, 110));
  }
  for (const g of level.gates ?? []) {
    zones.push(zone('gate', g.x + g.w / 2, g.y + g.h / 2, 110));
  }
  for (const l of level.levers ?? []) zones.push(zone('lever', l.x, l.y, 100));
  for (const b of level.breakables ?? []) {
    zones.push(zone('breakable', b.x + b.w / 2, b.y + b.h / 2, 100));
  }
  for (const c of level.crumbles ?? []) {
    zones.push(zone('crumble', c.x + c.w / 2, c.y, 100));
  }
  for (const s of level.seesaws ?? []) zones.push(zone('seesaw', s.x, s.y, 120));
  for (const b of level.bumpers ?? []) zones.push(zone('bumper', b.x, b.y, 100));
  for (const m of level.movingPlatforms ?? []) {
    zones.push(zone('moving', m.x + m.w / 2, m.y, 110));
  }
  for (const t of level.timedPlatforms ?? []) {
    zones.push(zone('timed', t.x + t.w / 2, t.y, 110));
  }
  for (const g of level.geysers ?? []) zones.push(zone('geyser', g.x, g.y, 110));
  for (const f of level.flameVents ?? []) zones.push(zone('flame', f.x, f.y - 40, 120));
  for (const a of level.acidPools ?? []) zones.push(zone('acid', a.x, a.y - 10, 110));
  for (const p of level.portals ?? []) zones.push(zone('portal', p.x, p.y, 100));

  for (const w of level.weapons) {
    const key = `weapon_${w.type}` as keyof typeof TIPS;
    if (key in TIPS) zones.push(zone(key, w.x, w.y, 100));
  }
  // Enemy tips are resolved live from sprites in GameScene (follow moving foes).

  return zones;
}

export function tipForEnemyType(type: EnemyType): { id: string; title: string; body: string } | null {
  const key = `enemy_${type}` as keyof typeof TIPS;
  const tip = TIPS[key];
  if (!tip) return null;
  return { id: key, title: tip.title, body: tip.body };
}

export function nearestTutorialZone(
  zones: TutorialZone[],
  x: number,
  y: number,
): TutorialZone | null {
  let best: TutorialZone | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const z of zones) {
    const d = Math.hypot(z.x - x, z.y - y);
    if (d <= z.radius && d < bestD) {
      bestD = d;
      best = z;
    }
  }
  return best;
}
