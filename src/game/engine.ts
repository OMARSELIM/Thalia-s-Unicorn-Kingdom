import { audioEngine } from './audio';
import {
  COMPANION_OPTIONS,
  CROWN_ITEMS,
  DEFAULT_POWER_UPGRADES,
  FUR_COLORS,
  GameMode,
  getMagnetUpgradeStats,
  getShieldUpgradeStats,
  getSpeedUpgradeStats,
  HORN_STYLES,
  HudSnapshot,
  MANE_THEMES,
  PlayerCustomization,
  PowerUpgrades,
  REALM_DEFINITIONS,
  RealmDefinition,
  RealmId,
  UNICORN_TRAITS,
  WING_STYLES,
} from './types';
import { drawCompanion, drawUnicorn } from './unicornRenderer';
import { downscaleCanvasSnapshot } from './memorySnapshot';

interface Platform {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'normal' | 'bouncy';
  bounceTimer: number;
  puffs: { ox: number; oy: number; r: number }[];
}

type CollectibleType =
  | 'star'
  | 'gem'
  | 'heart'
  | 'realmToken'
  | 'shield'
  | 'starRush'
  | 'chest'
  | 'portal'
  | 'secretPortal'
  | 'lightOrb';

interface Collectible {
  id: number;
  x: number;
  y: number;
  baseY: number;
  type: CollectibleType;
  phase: number;
  collected: boolean;
  portalMode?: 'bonus' | 'challenge';
}

interface TreasureChest {
  id: number;
  x: number;
  y: number;
  opened: boolean;
  openAnim: number; // 0 = closed, 1 = wide open
  nearGlow: number; // 0..1 proximity highlight
}

interface Hazard {
  id: number;
  type: 'storm' | 'moth' | 'thorn' | 'bossOrb' | 'miniPyramid';
  x: number;
  y: number;
  baseY: number;
  w: number;
  h: number;
  vx: number;
  phase: number;
  telegraphTimer: number;
  zapCycle: number;
  smashed: boolean;
}

interface BossState {
  active: boolean;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  attackPattern: number;
  x: number;
  y: number;
  attackTimer: number;
  orbSpawnTimer: number;
  hitFlashTimer: number;
  beamTimer: number;
  beamFromX: number;
  beamFromY: number;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  kind: 'spark' | 'star' | 'puff' | 'petal' | 'aura' | 'ring';
  additive: boolean;
  drag: number;
  rotation: number;
  spin: number;
}

interface TrailNode {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface BgStar {
  x: number;
  y: number;
  r: number;
  twinkleSpeed: number;
  phase: number;
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onGameOver: (finalSnapshot: HudSnapshot) => void;
  onBossDefeatCapture?: (payload: {
    realmId: RealmId;
    realmName: string;
    bossName: string;
    score: number;
    distance: number;
    imageDataUrl: string;
  }) => void;
}

export class UnicornGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  private width = 1280;
  private height = 720;
  private dpr = 1;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private running = false;
  private paused = false;

  private realmId: RealmId = 'clouds';
  private customization: PlayerCustomization = {
    traitId: 'luna',
    furId: 'pearl',
    maneId: 'rose',
    hornId: 'spiral-gold',
    wingId: 'feathered',
    crownId: 'none',
    accessoryId: 'none',
    companionId: 'bird',
  };
  private bestScore = 0;
  private powerUpgrades: PowerUpgrades = { ...DEFAULT_POWER_UPGRADES };

  private jumpHeld = false;
  private downHeld = false;
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;

  private player = {
    x: 200,
    y: 360,
    vy: 0,
    grounded: false,
    jumpsLeft: 2,
    maxJumps: 2,
    scaleX: 1,
    scaleY: 1,
    tilt: 0,
    flipTimer: 0,
    jumpBoostTimer: 0,
    highJumpCooldown: 0,
    highJumpMaxCooldown: 2.2,
    isDiving: false,
    wingFlap: 0,
    gallopPhase: 0,
    invulnTimer: 0,
    dashTimer: 0,
    dashGraceTimer: 0,
    dashCooldown: 0,
    dashMaxCooldown: 3.4,
    magnetTimer: 0,
    magnetMaxTimer: 6.5,
    shieldActive: false,
    shieldCharges: 0,
    starRushTimer: 0,
    starRushMaxTimer: 6.0,
  };

  private companion = {
    x: 150,
    y: 310,
    vx: 0,
    vy: 0,
    swooping: false,
    collectFlash: 0,
    targetId: 0,
  };

  private boss: BossState = {
    active: false,
    hp: 3,
    maxHp: 3,
    shield: 4,
    maxShield: 4,
    attackPattern: 0,
    x: 900,
    y: 260,
    attackTimer: 2.2,
    orbSpawnTimer: 1.5,
    hitFlashTimer: 0,
    beamTimer: 0,
    beamFromX: 0,
    beamFromY: 0,
  };

  private time = 0;
  private gameMode: GameMode = 'adventure';
  private timeTrialRemaining = 0;
  private timeTrialMaxTime = 0;
  private timeTrialTargetDistance = 230;
  private timeTrialOutcome: 'none' | 'won' | 'timeout' = 'none';
  private timeTrialRewardStars = 0;
  private finishLineSpawned = false;
  private finishLineX = 0;
  private lastUrgentTickSec = -1;
  private scrollSpeed = 320;
  private distance = 0;
  private nextBossDistance = 240;
  private score = 0;
  private starsCollected = 0;
  private realmTokensCollected = 0;
  private gemsCollected = 0;
  private chestsOpened = 0;
  private portalsEntered = 0;
  private bossesDefeated = 0;
  private tricksPerformed = 0;
  private trickStreak = 0;
  private readonly trickStreakTarget = 3;
  private trickStreakTimer = 0;
  private nextSecretMode: 'bonus' | 'challenge' = 'bonus';
  private secretZone: {
    mode: 'none' | 'bonus' | 'challenge';
    timer: number;
    maxTimer: number;
  } = {
    mode: 'none',
    timer: 0,
    maxTimer: 0,
  };
  private cloudsCleared = 0;
  private hearts = 7;
  private maxHearts = 7;
  private combo = 0;
  private comboTimer = 0;
  private realmBannerTimer = 0;
  private newHighScoreTriggered = false;

  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private flashAlpha = 0;
  private flashColor = '#FFFFFF';

  private nextId = 1;
  private platforms: Platform[] = [];
  private collectibles: Collectible[] = [];
  private chests: TreasureChest[] = [];
  private hazards: Hazard[] = [];
  private particles: Particle[] = [];
  private trailNodes: TrailNode[] = [];
  private floatingTexts: FloatingText[] = [];
  private bgStars: BgStar[] = [];
  private nextPlatformX = 0;
  private lastPlatformY = 440;
  private hudEmitTimer = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not acquire 2D canvas context');
    }
    this.ctx = context;
    this.callbacks = callbacks;

    for (let i = 0; i < 420; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 4,
        life: 0,
        maxLife: 1,
        color: '#FFFFFF',
        kind: 'spark',
        additive: false,
        drag: 0,
        rotation: 0,
        spin: 0,
      });
    }

    for (let i = 0; i < 70; i++) {
      this.bgStars.push({
        x: Math.random(),
        y: Math.random() * 0.78,
        r: 1 + Math.random() * 2.2,
        twinkleSpeed: 1.5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.resize();
  }

  public resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect?.width || window.innerWidth));
    const h = Math.max(320, Math.floor(rect?.height || window.innerHeight));
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = w;
    this.height = h;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.player.x = Math.min(220, Math.max(105, w * 0.2));
  }

  public setCustomization(
    customization: PlayerCustomization,
    bestScore: number,
    powerUpgrades?: PowerUpgrades
  ) {
    this.customization = customization;
    this.bestScore = bestScore;
    if (powerUpgrades) {
      this.powerUpgrades = powerUpgrades;
      const trait = this.getTrait();
      const speedStats = getSpeedUpgradeStats(powerUpgrades.speed);
      const magnetStats = getMagnetUpgradeStats(powerUpgrades.magnet);
      this.player.dashMaxCooldown = speedStats.dashCooldown * trait.dashCooldownFactor;
      this.player.magnetMaxTimer = magnetStats.duration;
      this.player.starRushMaxTimer = speedStats.starRushDuration;
    }
  }

  public startNewRun(
    realmId: RealmId,
    customization: PlayerCustomization,
    bestScore: number,
    mode: GameMode = 'adventure',
    powerUpgrades?: PowerUpgrades
  ) {
    this.realmId = realmId;
    this.customization = customization;
    this.bestScore = bestScore;
    this.gameMode = mode;
    if (powerUpgrades) {
      this.powerUpgrades = powerUpgrades;
    }
    this.resetWorld();
    this.running = true;
    this.paused = false;
    this.lastTimestamp = performance.now();
    audioEngine.setSpeedFactor(this.scrollSpeed);
    audioEngine.setSpeedActive(true);
    this.emitHud();

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(this.loop);
  }

  public setPaused(paused: boolean) {
    this.paused = paused;
    audioEngine.setSpeedActive(!paused && this.running);
    if (!paused && this.running) {
      this.lastTimestamp = performance.now();
    }
    this.clearInputs();
  }

  public stop() {
    this.running = false;
    this.paused = false;
    audioEngine.setSpeedActive(false);
    this.clearInputs();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public clearInputs() {
    this.jumpHeld = false;
    this.downHeld = false;
  }

  public triggerJumpDown() {
    if (!this.running || this.paused) return;
    this.jumpHeld = true;
    this.jumpBufferTimer = 0.13;
  }

  public triggerJumpUp() {
    this.jumpHeld = false;
  }

  public triggerDown(held: boolean) {
    this.downHeld = held;
  }

  public triggerHighJump() {
    if (!this.running || this.paused) return;
    if (this.player.highJumpCooldown > 0) return;

    this.player.vy = -850;
    this.player.grounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.player.jumpBoostTimer = 0.24;
    this.player.highJumpCooldown = this.player.highJumpMaxCooldown;
    this.player.jumpsLeft = Math.max(1, this.player.jumpsLeft);
    this.player.isDiving = false;
    this.player.scaleX = 0.74;
    this.player.scaleY = 1.32;
    this.player.wingFlap = 1;
    this.player.flipTimer = 0.44;
    this.tricksPerformed += 1;
    this.score += 35;
    this.shakeIntensity = Math.max(this.shakeIntensity, 4);
    audioEngine.playHighJump();

    const mane = this.getMane();
    for (let i = 0; i < 16; i++) {
      this.spawnParticle(
        this.player.x + (Math.random() - 0.5) * 32,
        this.player.y + 20,
        (Math.random() - 0.5) * 160,
        70 + Math.random() * 140,
        4.5 + Math.random() * 3,
        0.55,
        mane.colors[i % mane.colors.length],
        i % 2 === 0 ? 'star' : 'aura',
        true
      );
    }
    this.spawnFloatingText(this.player.x, this.player.y - 42, 'قفزة عالية! +35', '#E11D74');
    this.registerAcrobaticTrick();
    this.emitHud();
  }

  public triggerDash() {
    if (!this.running || this.paused) return;
    if (this.player.dashCooldown > 0 || this.player.dashTimer > 0) return;

    const speedStats = getSpeedUpgradeStats(this.powerUpgrades.speed);
    this.player.dashTimer = speedStats.dashDuration;
    this.player.dashGraceTimer = 0.16;
    this.player.dashCooldown = this.player.dashMaxCooldown;
    this.player.vy = Math.min(this.player.vy, 0) * 0.25;
    this.player.scaleX = 1.34;
    this.player.scaleY = 0.76;
    this.shakeIntensity = Math.max(this.shakeIntensity, 6.5);
    this.flashColor = '#FFFDF9';
    this.flashAlpha = Math.max(this.flashAlpha, 0.14);
    audioEngine.playDash();

    const mane = this.getMane();
    // Luminous shockwave ring & burst behind the unicorn on dash activation
    this.spawnParticle(
      this.player.x - 10,
      this.player.y,
      -80,
      0,
      44,
      0.34,
      mane.colors[0],
      'ring',
      true
    );
    for (let i = 0; i < 18; i++) {
      this.spawnParticle(
        this.player.x - 16,
        this.player.y + (Math.random() - 0.5) * 28,
        -220 - Math.random() * 180,
        (Math.random() - 0.5) * 110,
        4 + Math.random() * 4.5,
        0.48,
        i % 4 === 0 ? '#FFFDF9' : mane.colors[i % mane.colors.length],
        i % 3 === 0 ? 'aura' : 'star',
        true,
        1.4,
        (Math.random() - 0.5) * 10
      );
    }
    this.emitHud();
  }

  private getRealm(): RealmDefinition {
    return REALM_DEFINITIONS.find((r) => r.id === this.realmId) || REALM_DEFINITIONS[0];
  }

  private getTrait() {
    return UNICORN_TRAITS.find((t) => t.id === this.customization.traitId) || UNICORN_TRAITS[0];
  }

  private getFur() {
    return FUR_COLORS.find((f) => f.id === this.customization.furId) || FUR_COLORS[0];
  }

  private getMane() {
    return MANE_THEMES.find((m) => m.id === this.customization.maneId) || MANE_THEMES[0];
  }

  private getHorn() {
    return HORN_STYLES.find((h) => h.id === this.customization.hornId) || HORN_STYLES[0];
  }

  private getWings() {
    return WING_STYLES.find((w) => w.id === this.customization.wingId) || WING_STYLES[0];
  }

  private getCrown() {
    return (CROWN_ITEMS.find((c) => c.id === this.customization.crownId) || CROWN_ITEMS[0]).id;
  }

  private getCompanion() {
    return (
      COMPANION_OPTIONS.find((c) => c.id === this.customization.companionId) ||
      COMPANION_OPTIONS[0]
    );
  }

  private resetWorld() {
    const trait = this.getTrait();
    const realm = this.getRealm();
    this.time = 0;
    this.timeTrialOutcome = 'none';
    this.timeTrialRewardStars = 0;
    this.finishLineSpawned = false;
    this.finishLineX = 0;
    this.lastUrgentTickSec = -1;
    this.timeTrialTargetDistance = realm.timeTrialDistance;
    if (this.gameMode === 'timeTrial') {
      this.timeTrialMaxTime = realm.timeTrialSeconds;
      this.timeTrialRemaining = realm.timeTrialSeconds;
    } else {
      this.timeTrialMaxTime = 0;
      this.timeTrialRemaining = 0;
    }
    this.scrollSpeed = 315;
    this.distance = 0;
    this.nextBossDistance = 240;
    this.score = 0;
    this.starsCollected = 0;
    this.realmTokensCollected = 0;
    this.gemsCollected = 0;
    this.chestsOpened = 0;
    this.portalsEntered = 0;
    this.bossesDefeated = 0;
    this.tricksPerformed = 0;
    this.trickStreak = 0;
    this.trickStreakTimer = 0;
    this.nextSecretMode = 'bonus';
    this.secretZone = { mode: 'none', timer: 0, maxTimer: 0 };
    this.cloudsCleared = 0;
    this.hearts = 7;
    this.maxHearts = 7;
    this.combo = 0;
    this.comboTimer = 0;
    this.realmBannerTimer = 2.6;
    this.newHighScoreTriggered = false;
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;
    this.flashAlpha = 0;

    this.jumpHeld = false;
    this.downHeld = false;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;

    const startY = Math.min(this.height * 0.66, this.height - 140);
    this.player.x = Math.min(220, Math.max(105, this.width * 0.2));
    this.player.y = startY - 34;
    this.player.vy = 0;
    this.player.grounded = true;
    this.player.jumpsLeft = 2;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.player.tilt = 0;
    this.player.flipTimer = 0;
    this.player.jumpBoostTimer = 0;
    this.player.highJumpCooldown = 0;
    this.player.isDiving = false;
    this.player.wingFlap = 0;
    this.player.gallopPhase = 0;
    const shieldStats = getShieldUpgradeStats(this.powerUpgrades.shield);
    const speedStats = getSpeedUpgradeStats(this.powerUpgrades.speed);
    const magnetStats = getMagnetUpgradeStats(this.powerUpgrades.magnet);

    this.player.invulnTimer = 0;
    this.player.dashTimer = 0;
    this.player.dashGraceTimer = 0;
    this.player.dashMaxCooldown = speedStats.dashCooldown * trait.dashCooldownFactor;
    this.player.dashCooldown = 0;
    this.player.magnetTimer = 0;
    this.player.magnetMaxTimer = magnetStats.duration;
    this.player.shieldCharges = shieldStats.startWithShield ? 1 : 0;
    this.player.shieldActive = this.player.shieldCharges > 0;
    this.player.starRushTimer = 0;
    this.player.starRushMaxTimer = speedStats.starRushDuration;

    this.companion.x = this.player.x - 42;
    this.companion.y = this.player.y - 46;
    this.companion.vx = 0;
    this.companion.vy = 0;
    this.companion.swooping = false;
    this.companion.collectFlash = 0;
    this.companion.targetId = 0;

    this.boss.active = false;
    this.boss.hp = 3;
    this.boss.maxHp = 3;
    this.boss.shield = 4;
    this.boss.maxShield = 4;
    this.boss.attackPattern = 0;
    this.boss.beamTimer = 0;

    this.platforms = [];
    this.collectibles = [];
    this.chests = [];
    this.hazards = [];
    this.floatingTexts = [];
    this.trailNodes = [];
    for (const p of this.particles) p.active = false;

    const starter = this.createPlatform(60, startY, 540, 'normal');
    this.platforms.push(starter);
    for (let sx = 280; sx <= 520; sx += 58) {
      this.collectibles.push({
        id: this.nextId++,
        x: sx,
        y: startY - 56,
        baseY: startY - 56,
        type: sx === 454 ? 'realmToken' : 'star',
        phase: sx * 0.02,
        collected: false,
      });
    }

    this.nextPlatformX = 680;
    this.lastPlatformY = startY;
    this.populateWorldAhead();
  }

  private createPlatform(x: number, y: number, w: number, type: 'normal' | 'bouncy'): Platform {
    const puffs: { ox: number; oy: number; r: number }[] = [];
    const count = Math.max(3, Math.floor(w / 44));
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const ox = -w / 2 + t * w;
      const edgeFactor = Math.sin(t * Math.PI);
      const r = 20 + edgeFactor * 16 + (i % 2 === 0 ? 4 : 0);
      const oy = 6 - edgeFactor * 4;
      puffs.push({ ox, oy, r });
    }
    return {
      id: this.nextId++,
      x: x + w / 2,
      y,
      w,
      h: 28,
      type,
      bounceTimer: 0,
      puffs,
    };
  }

  private populateWorldAhead() {
    const minY = Math.max(150, this.height * 0.28);
    const maxY = Math.min(this.height - 95, this.height * 0.8);

    while (this.nextPlatformX < this.width + 650) {
      if (this.secretZone.mode === 'bonus') {
        // Golden Bonus Zone: wide bouncy clouds, dense star trails, frequent chests, zero hazards!
        const gap = 72 + Math.random() * 68;
        const width = 235 + Math.random() * 95;
        const deltaY = (Math.random() - 0.5) * 115;
        const y = Math.max(minY, Math.min(maxY, this.lastPlatformY + deltaY));
        const isBouncy = Math.random() < 0.45;
        const plat = this.createPlatform(
          this.nextPlatformX,
          y,
          width,
          isBouncy ? 'bouncy' : 'normal'
        );
        this.platforms.push(plat);

        for (let i = 0; i < 6; i++) {
          const sx = this.nextPlatformX + 26 + (i / 5) * (width - 52);
          const sy = y - 52 - Math.sin((i / 5) * Math.PI) * 34;
          this.collectibles.push({
            id: this.nextId++,
            x: sx,
            y: sy,
            baseY: sy,
            type: i === 2 && Math.random() < 0.35 ? 'gem' : 'star',
            phase: i * 0.4,
            collected: false,
          });
        }

        if (Math.random() < 0.55) {
          this.chests.push({
            id: this.nextId++,
            x: plat.x + (Math.random() - 0.5) * (width * 0.4),
            y: y - 18,
            opened: false,
            openAnim: 0,
            nearGlow: 0,
          });
        }

        this.nextPlatformX += width + gap;
        this.lastPlatformY = y;
        continue;
      }

      if (this.secretZone.mode === 'challenge') {
        // Extra Challenge Level: high bouncy cloud chains, big star arcs, chests, and thrilling hazards
        const gap = 108 + Math.random() * 76;
        const width = 165 + Math.random() * 75;
        const deltaY = (Math.random() - 0.5) * 175;
        const y = Math.max(minY, Math.min(maxY, this.lastPlatformY + deltaY));
        const isBouncy = Math.random() < 0.62;
        const plat = this.createPlatform(
          this.nextPlatformX,
          y,
          width,
          isBouncy ? 'bouncy' : 'normal'
        );
        this.platforms.push(plat);

        const arcSteps = 4;
        const arcStartX = this.nextPlatformX - gap * 0.78;
        const arcEndX = this.nextPlatformX + width * 0.5;
        for (let i = 0; i < arcSteps; i++) {
          const t = (i + 0.5) / arcSteps;
          const sx = arcStartX + (arcEndX - arcStartX) * t;
          const sy =
            (1 - t) * (this.lastPlatformY - 52) +
            t * (y - 52) -
            Math.sin(t * Math.PI) * 95;
          this.collectibles.push({
            id: this.nextId++,
            x: sx,
            y: sy,
            baseY: sy,
            type: i === 1 && Math.random() < 0.4 ? 'realmToken' : 'star',
            phase: i * 0.5,
            collected: false,
          });
        }

        if (Math.random() < 0.42) {
          this.chests.push({
            id: this.nextId++,
            x: plat.x,
            y: y - 18,
            opened: false,
            openAnim: 0,
            nearGlow: 0,
          });
        }

        if (Math.random() < 0.48) {
          const hy = Math.max(minY + 10, y - 92);
          this.hazards.push({
            id: this.nextId++,
            type: Math.random() < 0.55 ? 'moth' : 'storm',
            x: Math.random() < 0.5 ? this.nextPlatformX + width + 140 : plat.x,
            y: hy,
            baseY: hy,
            w: 50,
            h: 34,
            vx: -195,
            phase: Math.random() * Math.PI * 2,
            telegraphTimer: 0.7,
            zapCycle: 0,
            smashed: false,
          });
        }

        this.nextPlatformX += width + gap;
        this.lastPlatformY = y;
        continue;
      }

      const difficulty = Math.min(1, this.distance / 2000);
      const gap = 86 + Math.random() * (88 + difficulty * 54);
      const width = Math.max(140, 290 - difficulty * 80 + Math.random() * 95);

      const deltaY = (Math.random() - 0.48) * 155;
      const y = Math.max(minY, Math.min(maxY, this.lastPlatformY + deltaY));
      const isBouncy = Math.random() < 0.24;

      const plat = this.createPlatform(this.nextPlatformX, y, width, isBouncy ? 'bouncy' : 'normal');
      this.platforms.push(plat);

      // Arc of stars between platforms
      const arcSteps = 3 + Math.floor(Math.random() * 2);
      const arcStartX = this.nextPlatformX - gap * 0.82;
      const arcEndX = this.nextPlatformX + width * 0.3;
      const arcPeak = Math.min(this.lastPlatformY, y) - (isBouncy ? 130 : 95);
      for (let i = 0; i < arcSteps; i++) {
        const t = (i + 0.5) / arcSteps;
        const sx = arcStartX + (arcEndX - arcStartX) * t;
        const sy =
          (1 - t) * (this.lastPlatformY - 48) +
          t * (y - 48) -
          Math.sin(t * Math.PI) * (Math.abs(arcPeak - y) * 0.6 + 48);
        this.collectibles.push({
          id: this.nextId++,
          x: sx,
          y: sy,
          baseY: sy,
          type: 'star',
          phase: Math.random() * Math.PI * 2,
          collected: false,
        });
      }

      // Random Interactive Treasure Chests on platforms
      if (this.distance > 40 && width >= 150 && Math.random() < 0.28) {
        const chestOffset = (Math.random() - 0.5) * Math.max(0, width - 110);
        this.chests.push({
          id: this.nextId++,
          x: plat.x + chestOffset,
          y: y - 18,
          opened: false,
          openAnim: 0,
          nearGlow: 0,
        });
      }

      // Power-Ups, Realm Tokens, Gems & Hearts (next-level portals now open when defeating the realm Boss!)
      const featureRoll = Math.random();
      if (this.boss.active) {
        // Guarantee extra stars above platforms during boss battles to weaken the boss shield
        for (let ox = -55; ox <= 55; ox += 55) {
          this.collectibles.push({
            id: this.nextId++,
            x: plat.x + ox,
            y: y - 50,
            baseY: y - 50,
            type: 'star',
            phase: ox * 0.03,
            collected: false,
          });
        }
      } else if (featureRoll < 0.3) {
        // Power-up: Shield or Star Rush
        const cy = y - 62;
        const pType: CollectibleType =
          !this.player.shieldActive && Math.random() < 0.55 ? 'shield' : 'starRush';
        this.collectibles.push({
          id: this.nextId++,
          x: plat.x,
          y: cy,
          baseY: cy,
          type: pType,
          phase: Math.random() * Math.PI * 2,
          collected: false,
        });
      } else if (featureRoll < 0.58) {
        const specialType: CollectibleType =
          featureRoll < 0.44
            ? 'realmToken'
            : this.hearts < this.maxHearts && featureRoll < 0.51
              ? 'heart'
              : 'gem';
        const cy = y - 62;
        this.collectibles.push({
          id: this.nextId++,
          x: plat.x,
          y: cy,
          baseY: cy,
          type: specialType,
          phase: Math.random() * Math.PI * 2,
          collected: false,
        });
      } else if (width > 200) {
        for (let ox = -55; ox <= 55; ox += 55) {
          this.collectibles.push({
            id: this.nextId++,
            x: plat.x + ox,
            y: y - 48,
            baseY: y - 48,
            type: 'star',
            phase: ox * 0.03,
            collected: false,
          });
        }
      }

      // Telegraphed hazards (paused slightly during active boss so fight stays fair & fun!)
      if (this.distance > 85 && !this.boss.active) {
        const roll = Math.random();
        const isEgyptianHeritage = this.realmId === 'pharaohs' || this.realmId === 'egypt';
        if (
          isEgyptianHeritage &&
          width >= 180 &&
          (this.realmId === 'pharaohs' ? roll < 0.42 : roll < 0.24)
        ) {
          // Miniature Pyramid obstacle resting on golden sandstone platform
          const px = plat.x + (Math.random() - 0.5) * Math.max(0, width - 130);
          this.hazards.push({
            id: this.nextId++,
            type: 'miniPyramid',
            x: px,
            y: y - 16,
            baseY: y - 16,
            w: 40,
            h: 34,
            vx: 0,
            phase: Math.random() * Math.PI * 2,
            telegraphTimer: 0,
            zapCycle: 0,
            smashed: false,
          });
        } else {
          const stormWeight =
            this.realmId === 'clouds' || this.realmId === 'egypt' ? 0.36 : 0.24;
          const mothWeight =
            this.realmId === 'meadow' || this.realmId === 'qatar' || this.realmId === 'turkey'
              ? 0.3
              : 0.18;
          const thornWeight = this.realmId === 'forest' ? 0.26 : 0.12;

          if (roll < stormWeight + difficulty * 0.12) {
            const hx = plat.x + (Math.random() - 0.3) * (width * 0.45);
            const hy = y - 82 - Math.random() * 55;
            this.hazards.push({
              id: this.nextId++,
              type: 'storm',
              x: hx,
              y: hy,
              baseY: hy,
              w: 66,
              h: 40,
              vx: -18 - Math.random() * 20,
              phase: Math.random() * Math.PI * 2,
              telegraphTimer: 0,
              zapCycle: Math.random() * 2.2,
              smashed: false,
            });
          } else if (roll < stormWeight + mothWeight + difficulty * 0.12 && this.distance > 150) {
            const hy = Math.max(minY + 10, Math.min(maxY - 30, y - 55 - Math.random() * 65));
            this.hazards.push({
              id: this.nextId++,
              type: 'moth',
              x: this.nextPlatformX + width + 160,
              y: hy,
              baseY: hy,
              w: 44,
              h: 32,
              vx: -(155 + difficulty * 75),
              phase: Math.random() * Math.PI * 2,
              telegraphTimer: 0.85,
              zapCycle: 0,
              smashed: false,
            });
          } else if (roll < stormWeight + mothWeight + thornWeight && this.distance > 190) {
            const hy = Math.max(110, y - 160);
            this.hazards.push({
              id: this.nextId++,
              type: 'thorn',
              x: plat.x,
              y: hy,
              baseY: hy,
              w: 42,
              h: 42,
              vx: 0,
              phase: Math.random() * Math.PI * 2,
              telegraphTimer: 0,
              zapCycle: 0,
              smashed: false,
            });
          }
        }
      }

      this.nextPlatformX += width + gap;
      this.lastPlatformY = y;
    }
  }

  private loop = (timestamp: number) => {
    if (!this.running) return;
    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const dt = Math.min(Math.max(rawDt, 0), 0.05);

    if (!this.paused) {
      this.update(dt);
    }
    this.render();

    if (this.running) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private update(dt: number) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 28);
      return;
    }

    this.time += dt;
    const trait = this.getTrait();
    const mane = this.getMane();
    const realm = this.getRealm();

    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 26);
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.8);
    if (this.realmBannerTimer > 0) this.realmBannerTimer -= dt;
    if (this.player.invulnTimer > 0) this.player.invulnTimer -= dt;
    if (this.player.magnetTimer > 0) this.player.magnetTimer -= dt;
    if (this.player.starRushTimer > 0) this.player.starRushTimer -= dt;
    if (this.player.flipTimer > 0) this.player.flipTimer = Math.max(0, this.player.flipTimer - dt);
    if (this.player.jumpBoostTimer > 0) {
      this.player.jumpBoostTimer = Math.max(0, this.player.jumpBoostTimer - dt);
    }
    if (this.player.highJumpCooldown > 0) {
      this.player.highJumpCooldown = Math.max(0, this.player.highJumpCooldown - dt);
    }
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    }
    if (this.player.dashTimer <= 0 && this.player.dashGraceTimer > 0) {
      this.player.dashGraceTimer = Math.max(0, this.player.dashGraceTimer - dt);
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this.trickStreakTimer > 0) {
      this.trickStreakTimer -= dt;
      if (this.trickStreakTimer <= 0) {
        this.trickStreak = 0;
      }
    }

    if (this.secretZone.mode !== 'none') {
      this.secretZone.timer -= dt;
      if (this.secretZone.timer <= 0) {
        this.exitSecretZone();
      }
    }

    const speedStats = getSpeedUpgradeStats(this.powerUpgrades.speed);
    const difficulty = Math.min(1, this.distance / 2200);
    const zoneSpeedFactor = this.secretZone.mode === 'challenge' ? 1.15 : 1;
    const targetBaseSpeed = (315 + difficulty * 170) * zoneSpeedFactor;
    const effectiveSpeed =
      this.player.dashTimer > 0
        ? targetBaseSpeed * (1.85 + speedStats.speedMultiplierBonus)
        : this.player.starRushTimer > 0
          ? targetBaseSpeed * (1.45 + speedStats.speedMultiplierBonus)
          : targetBaseSpeed;
    this.scrollSpeed = effectiveSpeed;
    audioEngine.setSpeedFactor(effectiveSpeed);

    const distDelta = (effectiveSpeed * dt) / 26;
    this.distance += distDelta;
    this.score += distDelta * 0.8;

    // Race Against Time countdown & Finish Line progression
    if (this.gameMode === 'timeTrial' && this.timeTrialOutcome === 'none') {
      this.timeTrialRemaining = Math.max(0, this.timeTrialRemaining - dt);

      if (!this.finishLineSpawned && this.distance >= this.timeTrialTargetDistance - 28) {
        this.finishLineSpawned = true;
        this.spawnFloatingText(
          this.player.x + 60,
          this.player.y - 54,
          'نقطة النهاية قريبة!',
          '#D97706'
        );
      }

      if (this.finishLineSpawned) {
        this.finishLineX = this.player.x + (this.timeTrialTargetDistance - this.distance) * 26;
      }

      if (this.timeTrialRemaining <= 5 && this.timeTrialRemaining > 0) {
        const sec = Math.ceil(this.timeTrialRemaining);
        if (sec !== this.lastUrgentTickSec) {
          this.lastUrgentTickSec = sec;
          audioEngine.playClick();
          this.shakeIntensity = Math.max(this.shakeIntensity, 2.2);
        }
      }

      if (this.timeTrialRemaining <= 8 && this.timeTrialRemaining > 0 && Math.random() < 0.35) {
        this.spawnParticle(
          this.player.x + (Math.random() - 0.5) * 34,
          this.player.y + (Math.random() - 0.5) * 26,
          -90 - Math.random() * 80,
          (Math.random() - 0.5) * 40,
          3.2,
          0.32,
          this.timeTrialRemaining <= 5 ? '#FB7185' : '#F59E0B',
          'spark',
          true
        );
      }

      if (this.distance >= this.timeTrialTargetDistance) {
        this.timeTrialOutcome = 'won';
        const secLeft = Math.ceil(this.timeTrialRemaining);
        const bonusStars = 40 + secLeft * 3;
        this.timeTrialRewardStars = bonusStars;
        this.starsCollected += bonusStars;
        this.score += 250 + secLeft * 25;
        this.flashColor = '#FFFBEB';
        this.flashAlpha = 0.42;
        this.shakeIntensity = 7;
        audioEngine.playBossDefeat();
        this.spawnStarBurst(this.player.x + 24, this.player.y - 20, '#F59E0B', 26);
        this.spawnFloatingText(
          this.player.x,
          this.player.y - 46,
          `وصول رائع! +${bonusStars} ★`,
          '#D97706'
        );
        this.triggerGameOver();
        return;
      }

      if (this.timeTrialRemaining <= 0) {
        this.timeTrialOutcome = 'timeout';
        this.flashColor = '#FDA4AF';
        this.flashAlpha = 0.42;
        this.shakeIntensity = 9;
        audioEngine.playHurt();
        this.spawnFloatingText(this.player.x, this.player.y - 46, 'انتهى الوقت!', '#E11D48');
        this.triggerGameOver();
        return;
      }
    }

    // Trigger Mini-Boss Encounter periodically (only in Adventure mode outside secret zones)
    if (
      this.gameMode === 'adventure' &&
      this.secretZone.mode === 'none' &&
      !this.boss.active &&
      this.distance >= this.nextBossDistance
    ) {
      this.startBossEncounter();
    }

    if (this.boss.active) {
      this.updateBoss(dt);
    }

    if (!this.newHighScoreTriggered && this.bestScore > 0 && Math.floor(this.score) > this.bestScore) {
      this.newHighScoreTriggered = true;
      this.spawnFloatingText(this.player.x + 20, this.player.y - 52, 'رقم قياسي جديد!', '#E11D74');
    }

    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
    if (this.player.grounded) {
      this.coyoteTimer = 0.12;
      this.player.jumpsLeft = this.player.maxJumps;
      this.player.highJumpCooldown = 0;
      this.player.isDiving = false;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        const diveSpring = this.downHeld;
        this.player.vy = diveSpring ? -820 : -615;
        this.player.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.player.jumpBoostTimer = 0.25;
        this.player.jumpsLeft = this.player.maxJumps - 1;
        this.player.scaleX = 0.8;
        this.player.scaleY = 1.26;
        this.player.wingFlap = 1;
        if (diveSpring) {
          audioEngine.playHighJump();
          this.spawnFloatingText(this.player.x, this.player.y - 38, 'قفزة عالية!', '#E11D74');
        } else {
          audioEngine.playJump(false);
        }
        this.emitJumpSparkles(mane.colors);
      } else if (this.player.jumpsLeft > 0) {
        // Double Jump in mid-air with distinct light ring & wing-sparkle burst
        this.player.vy = -590;
        this.player.jumpsLeft -= 1;
        this.jumpBufferTimer = 0;
        this.player.jumpBoostTimer = 0.22;
        this.player.scaleX = 0.82;
        this.player.scaleY = 1.24;
        this.player.wingFlap = 1;
        this.player.flipTimer = 0.42;
        this.player.isDiving = false;
        this.tricksPerformed += 1;
        this.score += 25;
        audioEngine.playJump(true);
        audioEngine.playTrick();
        this.emitDoubleJumpSparkles(mane.colors);
        this.spawnFloatingText(
          this.player.x,
          this.player.y - 36,
          '+25 قفزة مزدوجة!',
          '#F59E0B'
        );
        this.registerAcrobaticTrick();
        this.emitHud();
      }
    }

    if (this.player.dashTimer > 0) {
      this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);
      this.player.dashGraceTimer = 0.16;
      this.player.vy = 0;
      this.player.isDiving = false;
      // Radiant horizontal speed-streak trail behind the dashing unicorn
      for (let s = 0; s < 2; s++) {
        if (Math.random() < 0.85) {
          this.spawnParticle(
            this.player.x - 22 - Math.random() * 14,
            this.player.y + (Math.random() - 0.5) * 26,
            -240 - Math.random() * 140,
            (Math.random() - 0.5) * 24,
            4.5 + Math.random() * 4,
            0.38,
            s === 0 ? '#FFFDF9' : mane.colors[Math.floor(Math.random() * mane.colors.length)],
            s === 0 ? 'aura' : Math.random() < 0.5 ? 'star' : 'spark',
            true,
            1.4,
            (Math.random() - 0.5) * 8
          );
        }
      }
    } else {
      let gravity = 1480;
      if (this.downHeld && !this.player.grounded) {
        gravity = 2750;
        this.player.isDiving = true;
        if (Math.random() < 0.65) {
          this.spawnParticle(
            this.player.x,
            this.player.y - 16,
            -60,
            -120,
            4,
            0.3,
            '#FBBF24',
            'spark'
          );
        }
      } else {
        this.player.isDiving = false;
        if (this.jumpHeld && this.player.vy < 0 && this.player.jumpBoostTimer > 0) {
          // Hold jump button to soar noticeably higher
          gravity = 1480 * 0.52;
        } else if (this.jumpHeld && this.player.vy > 0) {
          gravity = 1480 * trait.glideGravityFactor;
          this.player.wingFlap = 0.55 + Math.sin(this.time * 18) * 0.35;
          if (Math.random() < 0.25) {
            this.spawnParticle(
              this.player.x - 16,
              this.player.y + 8,
              -90,
              20,
              3,
              0.4,
              '#FFFFFF',
              'spark'
            );
          }
        }
      }
      this.player.vy += gravity * dt;
      this.player.vy = Math.min(this.player.vy, 950);
    }

    const prevY = this.player.y;
    this.player.y += this.player.vy * dt;

    if (this.player.y < 52) {
      this.player.y = 52;
      if (this.player.vy < 0) this.player.vy = 0;
    }

    this.player.scaleX += (1 - this.player.scaleX) * Math.min(1, dt * 14);
    this.player.scaleY += (1 - this.player.scaleY) * Math.min(1, dt * 14);
    this.player.wingFlap = Math.max(0, this.player.wingFlap - dt * 3.2);
    this.player.gallopPhase += dt * (this.player.grounded ? 13 : 6);
    const targetTilt =
      this.player.dashTimer > 0
        ? 0.08
        : this.player.isDiving
          ? 0.42
          : Math.max(-0.28, Math.min(0.32, this.player.vy / 1700));
    this.player.tilt += (targetTilt - this.player.tilt) * Math.min(1, dt * 12);

    this.player.grounded = false;
    const scrollDx = effectiveSpeed * dt;
    this.nextPlatformX -= scrollDx;

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.x -= scrollDx;
      if (p.bounceTimer > 0) p.bounceTimer = Math.max(0, p.bounceTimer - dt);

      const halfW = p.w / 2;
      const footOffset = 22;
      const withinX = this.player.x + 14 > p.x - halfW && this.player.x - 14 < p.x + halfW;
      const wasAbove = prevY + footOffset <= p.y + 12;
      const nowAtOrBelow = this.player.y + footOffset >= p.y;

      if (withinX && this.player.vy >= 0 && wasAbove && nowAtOrBelow) {
        const landedFromDive = this.player.isDiving;
        this.player.isDiving = false;
        this.player.y = p.y - footOffset;

        if (p.type === 'bouncy') {
          this.player.vy = landedFromDive ? -860 : -780;
          this.player.grounded = false;
          this.player.jumpsLeft = this.player.maxJumps;
          this.player.scaleX = 0.76;
          this.player.scaleY = 1.3;
          p.bounceTimer = 0.25;
          audioEngine.playBounce();
          if (landedFromDive) {
            this.tricksPerformed += 1;
            this.score += 30;
            this.spawnFloatingText(this.player.x, this.player.y - 38, '+30 قفزة بهلوانية!', '#E11D74');
            this.registerAcrobaticTrick();
          }
          for (let k = 0; k < 10; k++) {
            this.spawnParticle(
              this.player.x + (Math.random() - 0.5) * 32,
              p.y,
              (Math.random() - 0.5) * 140,
              -80 - Math.random() * 140,
              5,
              0.65,
              k % 2 === 0 ? '#F472B6' : '#FDE047',
              'petal'
            );
          }
        } else {
          if (this.player.vy > 180 || landedFromDive) {
            this.player.scaleX = landedFromDive ? 1.32 : 1.22;
            this.player.scaleY = landedFromDive ? 0.74 : 0.82;
            p.bounceTimer = 0.16;
            const puffCount = landedFromDive ? 10 : 5;
            for (let k = 0; k < puffCount; k++) {
              this.spawnParticle(
                this.player.x + (Math.random() - 0.5) * 34,
                p.y + 2,
                (Math.random() - 0.5) * 120,
                -20 - Math.random() * 50,
                6 + Math.random() * 4,
                0.38,
                landedFromDive ? '#FDE68A' : '#FFFFFF',
                'puff'
              );
            }
          }
          this.player.vy = 0;
          this.player.grounded = true;
        }
      }

      if (p.x + halfW < -140) {
        this.platforms.splice(i, 1);
      }
    }

    if (this.player.grounded && Math.random() < 0.48) {
      this.spawnParticle(
        this.player.x - 16,
        this.player.y + 18,
        -90,
        -15 - Math.random() * 25,
        3.4,
        0.4,
        mane.colors[Math.floor(Math.random() * mane.colors.length)],
        'spark',
        true
      );
    }

    // Sparkling golden sands drifting in Ancient Egyptian realms
    if ((this.realmId === 'pharaohs' || this.realmId === 'egypt') && Math.random() < 0.72) {
      this.spawnParticle(
        this.width * (0.2 + Math.random() * 0.85),
        this.height * (0.38 + Math.random() * 0.56),
        -130 - Math.random() * 110,
        -12 + (Math.random() - 0.5) * 26,
        2.4 + Math.random() * 2.8,
        0.75 + Math.random() * 0.35,
        Math.random() < 0.5 ? '#FDE047' : '#F59E0B',
        Math.random() < 0.35 ? 'star' : 'spark',
        true
      );
    }

    // Soft ambient magical glow motes around the unicorn
    if (Math.random() < 0.42) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 14 + Math.random() * 22;
      this.spawnParticle(
        this.player.x + Math.cos(ang) * rad,
        this.player.y + Math.sin(ang) * rad * 0.75,
        -45 - Math.random() * 35,
        -18 - Math.random() * 24,
        4.5 + Math.random() * 4.5,
        0.55 + Math.random() * 0.25,
        mane.colors[Math.floor(Math.random() * mane.colors.length)],
        'aura',
        true,
        1.6
      );
    }

    // Continuous luminous ribbon trail behind acrobatic tricks & high-speed moves
    const isAcrobaticTrail =
      this.player.flipTimer > 0 ||
      this.player.isDiving ||
      this.player.dashTimer > 0 ||
      this.player.starRushTimer > 0;
    if (isAcrobaticTrail) {
      const trailColor =
        this.player.starRushTimer > 0
          ? '#FBBF24'
          : this.player.isDiving
            ? '#F59E0B'
            : mane.colors[Math.floor(this.time * 12) % mane.colors.length];
      this.trailNodes.push({
        x: this.player.x - 14,
        y: this.player.y + (this.player.flipTimer > 0 ? Math.sin(this.time * 28) * 10 : 0),
        life: this.player.dashTimer > 0 ? 0.52 : 0.42,
        maxLife: this.player.dashTimer > 0 ? 0.52 : 0.42,
        color: trailColor,
        width: this.player.dashTimer > 0 ? 22 : this.player.starRushTimer > 0 ? 16 : 11,
      });

      if (this.player.flipTimer > 0 && Math.random() < 0.85) {
        this.spawnParticle(
          this.player.x - 10,
          this.player.y + (Math.random() - 0.5) * 22,
          -120 - Math.random() * 60,
          (Math.random() - 0.5) * 90,
          4.5 + Math.random() * 3,
          0.48,
          '#FEF08A',
          'star',
          true,
          1.2,
          (Math.random() - 0.5) * 10
        );
      }
    }

    // Update luminous trail nodes
    for (let i = this.trailNodes.length - 1; i >= 0; i--) {
      const node = this.trailNodes[i];
      node.x -= scrollDx * 0.86;
      node.life -= dt;
      if (node.life <= 0) {
        this.trailNodes.splice(i, 1);
      }
    }

    // Update Flying Companion
    this.updateCompanion(dt);

    const magnetStats = getMagnetUpgradeStats(this.powerUpgrades.magnet);
    const magnetRange =
      (this.player.starRushTimer > 0
        ? magnetStats.activeRadius + 50
        : this.player.magnetTimer > 0
          ? magnetStats.activeRadius
          : 65 + magnetStats.passiveBonusRadius) + trait.magnetRadiusBonus;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.x -= scrollDx;
      c.y = c.baseY + Math.sin(this.time * 4.2 + c.phase) * 6;

      const dx = this.player.x - c.x;
      const dy = this.player.y - c.y;
      const dist = Math.hypot(dx, dy);

      if (
        (c.type === 'star' || c.type === 'realmToken' || c.type === 'gem') &&
        dist < magnetRange &&
        dist > 1
      ) {
        const pull =
          (this.player.starRushTimer > 0 || this.player.magnetTimer > 0
            ? magnetStats.pullSpeed
            : 280 + magnetStats.passiveBonusRadius * 2) * dt;
        c.x += (dx / dist) * pull;
        c.baseY += (dy / dist) * pull;
        c.y = c.baseY;
      }

      const comp = this.getCompanion();
      const compDist =
        comp.id !== 'none' ? Math.hypot(this.companion.x - c.x, this.companion.y - c.y) : 9999;

      const pickupRadius =
        c.type === 'secretPortal' ? 54 : c.type === 'portal' ? 48 : c.type === 'chest' ? 44 : 38;
      const pickedByCompanion =
        compDist < 34 && (c.type === 'star' || c.type === 'realmToken');

      if (dist < pickupRadius || pickedByCompanion) {
        c.collected = true;
        if (pickedByCompanion) {
          this.companion.collectFlash = 0.25;
          this.companion.targetId = 0;
          this.spawnStarBurst(this.companion.x, this.companion.y, comp.primaryColor, 6);
        }
        this.collectItem(c, realm);
        this.collectibles.splice(i, 1);
        continue;
      }

      if (c.x < -90) {
        this.collectibles.splice(i, 1);
      }
    }

    // Update & open interactive treasure chests on proximity
    for (let i = this.chests.length - 1; i >= 0; i--) {
      const ch = this.chests[i];
      ch.x -= scrollDx;

      const dist = Math.hypot(this.player.x - ch.x, this.player.y - ch.y);
      if (!ch.opened) {
        const targetGlow = dist < 150 ? 1 : 0;
        ch.nearGlow += (targetGlow - ch.nearGlow) * Math.min(1, dt * 10);
        if (dist < 62) {
          this.openTreasureChest(ch);
        }
      } else {
        ch.openAnim = Math.min(1, ch.openAnim + dt * 4.5);
      }

      if (ch.x < -100) {
        this.chests.splice(i, 1);
      }
    }

    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      if (h.type === 'moth') {
        if (h.telegraphTimer > 0 && h.x < this.width + 60) {
          h.x = this.width - 24;
          h.telegraphTimer -= dt;
        } else {
          h.x += (h.vx - scrollDx * 0.55) * dt;
          h.y = h.baseY + Math.sin(this.time * 6 + h.phase) * 18;
        }
      } else if (h.type === 'storm') {
        h.x += (h.vx - scrollDx) * dt;
        h.y = h.baseY + Math.sin(this.time * 2.5 + h.phase) * 8;
        h.zapCycle = (h.zapCycle + dt) % 2.4;
      } else if (h.type === 'bossOrb') {
        h.x += h.vx * dt;
        h.y = h.baseY + Math.sin(this.time * 7 + h.phase) * 10;
      } else {
        h.x -= scrollDx;
      }

      if (!h.smashed && h.telegraphTimer <= 0) {
        const hitX = Math.abs(this.player.x - h.x) < h.w * 0.42 + 18;
        const hitY = Math.abs(this.player.y - h.y) < h.h * 0.42 + 18;
        if (hitX && hitY) {
          const isDashing = this.player.dashTimer > 0 || this.player.dashGraceTimer > 0;
          const isStaticObstacle = h.type === 'thorn' || h.type === 'miniPyramid';
          if (isDashing && isStaticObstacle) {
            // Phase cleanly through static environmental obstacles without halting speed
            h.smashed = true;
            this.cloudsCleared += 1;
            this.score += 40;
            this.flashColor = '#FFFBEB';
            this.flashAlpha = Math.max(this.flashAlpha, 0.12);
            audioEngine.playStarPickup(2);
            this.spawnStarBurst(h.x, h.y, '#FDE047', 14);
            this.spawnFloatingText(h.x, h.y - 24, '+40 تجاوز خاطف!', '#F59E0B');
            this.registerAcrobaticTrick();
            this.emitHud();
            continue;
          } else if (
            isDashing ||
            this.player.starRushTimer > 0 ||
            (this.player.isDiving && this.player.y < h.y)
          ) {
            h.smashed = true;
            this.cloudsCleared += 1;
            this.score += 45;
            if (this.player.isDiving) {
              this.player.vy = -520;
              this.player.isDiving = false;
            }
            this.hitstopTimer = 0.045;
            this.shakeIntensity = 9;
            this.flashColor = '#FFFBEB';
            this.flashAlpha = 0.25;
            audioEngine.playCloudSmash();
            this.spawnStarBurst(h.x, h.y, '#FBBF24', 18);
            this.spawnFloatingText(h.x, h.y - 20, '+45 تشتيت سحري!', '#F59E0B');
            this.registerAcrobaticTrick();
            this.emitHud();
            this.hazards.splice(i, 1);
            continue;
          } else if (this.player.invulnTimer <= 0) {
            this.damagePlayer();
            if (h.type === 'bossOrb') {
              this.hazards.splice(i, 1);
              continue;
            }
          }
        }
      }

      if (h.x < -120) {
        this.hazards.splice(i, 1);
      }
    }

    if (this.player.y > this.height + 55) {
      if (this.player.shieldCharges > 0 || this.player.shieldActive) {
        const shieldStats = getShieldUpgradeStats(this.powerUpgrades.shield);
        this.player.shieldCharges = Math.max(0, this.player.shieldCharges - 1);
        this.player.shieldActive = this.player.shieldCharges > 0;
        this.player.invulnTimer = shieldStats.invulnDuration;
        if (shieldStats.blockBonusScore > 0) {
          this.score += shieldStats.blockBonusScore;
        }
        this.player.vy = -680;
        this.player.y = this.height - 60;
        this.player.jumpsLeft = 1;
        audioEngine.playShieldBreak();
        this.spawnFloatingText(
          this.player.x,
          this.height - 95,
          this.player.shieldCharges > 0
            ? `حماية درع اللؤلؤ! (متبقي ${this.player.shieldCharges})`
            : 'حماية درع اللؤلؤ!',
          '#F472B6'
        );
        this.emitHud();
      } else if (this.hearts > 1) {
        this.hearts -= 1;
        this.combo = 0;
        this.trickStreak = 0;
        this.trickStreakTimer = 0;
        this.player.invulnTimer = 1.6;
        this.player.vy = -660;
        this.player.y = this.height - 60;
        this.player.jumpsLeft = 1;
        this.shakeIntensity = 10;
        this.flashColor = '#FDA4AF';
        this.flashAlpha = 0.28;
        audioEngine.playHurt();
        this.spawnFloatingText(this.player.x, this.height - 95, 'إنقاذ سريع!', '#FB7185');
        this.emitHud();
      } else {
        this.hearts = 0;
        this.triggerGameOver();
        return;
      }
    }

    this.populateWorldAhead();

    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      if (p.drag > 0) {
        const damp = Math.max(0, 1 - p.drag * dt);
        p.vx *= damp;
        p.vy *= damp;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
      if (p.kind === 'petal') {
        p.vy += 120 * dt;
      } else if (p.kind === 'aura') {
        p.vy -= 14 * dt;
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.08) {
      this.hudEmitTimer = 0;
      this.emitHud();
    }
  }

  private updateCompanion(dt: number) {
    const comp = this.getCompanion();
    if (comp.id === 'none') return;

    if (this.companion.collectFlash > 0) {
      this.companion.collectFlash = Math.max(0, this.companion.collectFlash - dt);
    }

    // Playful figure-8 flight position hovering beside the unicorn
    const restX = this.player.x - 36 + Math.sin(this.time * 2.1) * 12;
    const restY = this.player.y - 46 + Math.sin(this.time * 4.2) * 7;

    // Keep locked target if still valid and within 245px, otherwise pick nearest star/realmToken
    let target: Collectible | null = null;
    if (this.companion.targetId) {
      const existing = this.collectibles.find(
        (c) =>
          c.id === this.companion.targetId &&
          !c.collected &&
          (c.type === 'star' || c.type === 'realmToken') &&
          c.x > 40 &&
          c.x < this.width - 30 &&
          Math.hypot(c.x - this.player.x, c.y - this.player.y) < 245
      );
      if (existing) target = existing;
    }

    if (!target) {
      let bestD = 235;
      for (const c of this.collectibles) {
        if (c.collected || (c.type !== 'star' && c.type !== 'realmToken')) continue;
        const d = Math.hypot(c.x - this.player.x, c.y - this.player.y);
        if (d < bestD && c.x > 40 && c.x < this.width - 30) {
          bestD = d;
          target = c;
        }
      }
      this.companion.targetId = target ? target.id : 0;
    }

    const prevX = this.companion.x;
    const prevY = this.companion.y;

    if (target) {
      this.companion.swooping = true;
      const dx = target.x - this.companion.x;
      const dy = target.y - this.companion.y;
      const dist = Math.hypot(dx, dy);
      const swoopSpeed = 480 + this.scrollSpeed * 0.72;
      if (dist > 1) {
        const step = Math.min(dist, swoopSpeed * dt);
        this.companion.x += (dx / dist) * step;
        this.companion.y += (dy / dist) * step;
      }
    } else {
      this.companion.swooping = false;
      const followRate = Math.min(1, dt * 6.5);
      this.companion.x += (restX - this.companion.x) * followRate;
      this.companion.y += (restY - this.companion.y) * followRate;
    }

    if (dt > 0.0001) {
      this.companion.vx = (this.companion.x - prevX) / dt;
      this.companion.vy = (this.companion.y - prevY) / dt;
    }

    if (this.companion.swooping ? Math.random() < 0.55 : Math.random() < 0.16) {
      this.spawnParticle(
        this.companion.x - 10,
        this.companion.y + 2,
        -55 - Math.random() * 30,
        (Math.random() - 0.5) * 28,
        this.companion.swooping ? 3.2 : 2.3,
        0.32,
        this.companion.swooping ? '#FEF08A' : comp.primaryColor,
        this.companion.swooping ? 'star' : 'spark'
      );
    }
  }

  private collectItem(c: Collectible, realm: RealmDefinition) {
    if (c.type === 'star') {
      this.starsCollected += 1;
      this.combo = Math.min(10, this.combo + 1);
      this.comboTimer = 2.4;
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - 0.22);
      const mult = Math.min(5, 1 + Math.floor(this.combo / 3));
      this.score += 10 * mult;
      audioEngine.playStarPickup(this.combo);
      this.spawnStarBurst(c.x, c.y, '#FBBF24', 7);
      if (mult > 1 && this.combo % 3 === 0) {
        this.spawnFloatingText(c.x, c.y - 20, `×${mult} رائع!`, '#F59E0B');
      }
      if (this.boss.active) {
        this.weakenBossShield(c.x, c.y, 1);
      }
    } else if (c.type === 'realmToken') {
      this.realmTokensCollected += 1;
      this.starsCollected += 2;
      this.score += 35;
      audioEngine.playGemPickup();
      this.spawnStarBurst(c.x, c.y, realm.accentColor, 11);
      this.spawnFloatingText(c.x, c.y - 22, `+1 ${realm.specialItemName}`, realm.accentColor);
      if (this.boss.active) {
        this.weakenBossShield(c.x, c.y, 2);
      }
    } else if (c.type === 'gem') {
      const magnetStats = getMagnetUpgradeStats(this.powerUpgrades.magnet);
      this.gemsCollected += 1;
      this.score += 60;
      this.starsCollected += 3;
      this.player.dashCooldown = 0;
      this.player.magnetMaxTimer = magnetStats.duration;
      this.player.magnetTimer = magnetStats.duration;
      audioEngine.playGemPickup();
      this.spawnStarBurst(c.x, c.y, '#38BDF8', 14);
      this.spawnFloatingText(c.x, c.y - 24, 'تفعيل مغناطيس النجوم!', '#0EA5E9');
    } else if (c.type === 'heart') {
      this.hearts = Math.min(this.maxHearts, this.hearts + 1);
      this.score += 30;
      audioEngine.playHeartPickup();
      this.spawnStarBurst(c.x, c.y, '#E11D48', 14);
      this.spawnFloatingText(c.x, c.y - 24, '+1 قلب ياقوت', '#E11D48');
    } else if (c.type === 'shield') {
      const shieldStats = getShieldUpgradeStats(this.powerUpgrades.shield);
      if (this.player.shieldCharges >= shieldStats.maxCharges) {
        this.score += 55;
        this.starsCollected += 2;
        this.spawnFloatingText(c.x, c.y - 24, 'تعزيز الدرع السحري! +55', '#E11D74');
      } else {
        this.player.shieldCharges = shieldStats.maxCharges;
        this.player.shieldActive = true;
        this.score += 35;
        this.spawnFloatingText(
          c.x,
          c.y - 24,
          shieldStats.maxCharges > 1
            ? `تفعيل الدرع السحري ×${shieldStats.maxCharges}!`
            : 'تفعيل الدرع السحري!',
          '#E11D74'
        );
      }
      audioEngine.playShieldPickup();
      this.spawnStarBurst(c.x, c.y, '#F472B6', 14);
    } else if (c.type === 'starRush') {
      const speedStats = getSpeedUpgradeStats(this.powerUpgrades.speed);
      this.player.starRushMaxTimer = speedStats.starRushDuration;
      this.player.starRushTimer = speedStats.starRushDuration;
      this.player.dashCooldown = 0;
      this.score += 50;
      audioEngine.playPowerStarRush();
      this.spawnStarBurst(c.x, c.y, '#FBBF24', 18);
      this.spawnFloatingText(c.x, c.y - 26, 'تفعيل السرعة الخارقة!', '#D97706');
    } else if (c.type === 'chest') {
      this.chestsOpened += 1;
      this.starsCollected += 6;
      this.score += 75;
      this.hitstopTimer = 0.035;
      this.shakeIntensity = 6;
      audioEngine.playChestOpen();
      this.spawnStarBurst(c.x, c.y, '#F59E0B', 22);
      this.spawnFloatingText(c.x, c.y - 28, 'كنز ذهبي! +6 ★', '#B45309');
    } else if (c.type === 'portal') {
      this.portalsEntered += 1;
      this.score += 100;
      this.starsCollected += 4;
      this.player.invulnTimer = 1.8;
      this.nextBossDistance = this.distance + 240;
      const realmOrder: RealmId[] = [
        'clouds',
        'forest',
        'meadow',
        'egypt',
        'qatar',
        'turkey',
        'pharaohs',
      ];
      const nextIdx = (realmOrder.indexOf(this.realmId) + 1) % realmOrder.length;
      this.realmId = realmOrder[nextIdx];
      const newRealm = this.getRealm();
      this.realmBannerTimer = 2.6;
      this.flashColor = '#FFFDF9';
      this.flashAlpha = 0.45;
      this.shakeIntensity = 7;
      audioEngine.playPortalWarp();
      this.spawnStarBurst(c.x, c.y, newRealm.accentColor, 20);
      this.spawnFloatingText(c.x, c.y - 28, `انتقال إلى ${newRealm.name}!`, newRealm.accentColor);
    } else if (c.type === 'secretPortal') {
      this.enterSecretZone(c.portalMode || 'bonus');
    } else if (c.type === 'lightOrb') {
      this.hitBossWithLightOrb(c.x, c.y);
    }

    this.emitHud();
  }

  private registerAcrobaticTrick() {
    if (this.gameMode !== 'adventure' || this.secretZone.mode !== 'none') return;
    const hasPortalAhead = this.collectibles.some((c) => c.type === 'secretPortal' && !c.collected);
    if (hasPortalAhead) return;

    this.trickStreak += 1;
    this.trickStreakTimer = 6.5;

    if (this.trickStreak >= this.trickStreakTarget) {
      const mode = this.nextSecretMode;
      this.nextSecretMode = mode === 'bonus' ? 'challenge' : 'bonus';
      this.trickStreak = 0;
      this.trickStreakTimer = 0;

      const px = Math.max(this.player.x + 420, this.width + 60);
      const py = Math.max(165, Math.min(this.height - 170, this.lastPlatformY - 82));
      this.collectibles.push({
        id: this.nextId++,
        x: px,
        y: py,
        baseY: py,
        type: 'secretPortal',
        phase: 0,
        collected: false,
        portalMode: mode,
      });

      audioEngine.playSecretPortalAppear();
      this.spawnFloatingText(
        this.player.x + 40,
        this.player.y - 54,
        mode === 'bonus'
          ? 'تألق بهلواني! ظهرت بوابة المكافآت!'
          : 'تألق بهلواني! ظهرت بوابة التحدي!',
        mode === 'bonus' ? '#D97706' : '#0D9488'
      );
    }
  }

  private enterSecretZone(mode: 'bonus' | 'challenge') {
    const duration = mode === 'bonus' ? 11 : 12;
    this.secretZone = { mode, timer: duration, maxTimer: duration };
    this.portalsEntered += 1;
    this.score += 120;
    this.starsCollected += 5;
    this.player.invulnTimer = 1.6;
    if (this.boss.active) {
      this.boss.active = false;
      this.nextBossDistance = this.distance + 220;
    }

    this.hazards = [];
    this.collectibles = this.collectibles.filter((c) => c.x < this.player.x + 120);
    this.chests = this.chests.filter((ch) => ch.x < this.player.x + 120);
    this.platforms = this.platforms.filter((p) => p.x + p.w / 2 > -60 && p.x - p.w / 2 < this.player.x + 180);

    const safeY = Math.min(this.height * 0.68, Math.max(this.height * 0.45, this.player.y + 42));
    const landing = this.createPlatform(this.player.x - 40, safeY, 340, 'normal');
    this.platforms.push(landing);
    this.nextPlatformX = this.player.x + 390;
    this.lastPlatformY = safeY;
    this.populateWorldAhead();

    this.realmBannerTimer = 2.6;
    this.flashColor = mode === 'bonus' ? '#FEF3C7' : '#CCFBF1';
    this.flashAlpha = 0.48;
    this.shakeIntensity = 8;
    audioEngine.playPortalWarp();
    this.spawnStarBurst(
      this.player.x,
      this.player.y,
      mode === 'bonus' ? '#FBBF24' : '#2DD4BF',
      24
    );
    this.spawnFloatingText(
      this.player.x + 20,
      this.player.y - 36,
      mode === 'bonus' ? 'دخول منطقة المكافآت!' : 'دخول مستوى التحدي!',
      mode === 'bonus' ? '#D97706' : '#0D9488'
    );
  }

  private exitSecretZone() {
    const completedMode = this.secretZone.mode;
    this.secretZone = { mode: 'none', timer: 0, maxTimer: 0 };
    this.player.invulnTimer = 2.0;
    this.hazards = [];

    if (completedMode === 'challenge') {
      this.score += 120;
      this.starsCollected += 6;
      this.spawnFloatingText(this.player.x, this.player.y - 42, 'اجتياز التحدي! +120 و6 ★', '#0D9488');
    } else {
      this.score += 60;
      this.starsCollected += 3;
      this.spawnFloatingText(this.player.x, this.player.y - 42, 'مكافآت مكتملة! +60 و3 ★', '#D97706');
    }

    this.realmBannerTimer = 2.4;
    this.flashColor = '#FFFDF9';
    this.flashAlpha = 0.42;
    audioEngine.playSecretZoneComplete();
    this.emitHud();
  }

  private openTreasureChest(ch: TreasureChest) {
    ch.opened = true;
    ch.openAnim = 0.05;
    this.chestsOpened += 1;
    this.hitstopTimer = 0.035;
    this.shakeIntensity = Math.max(this.shakeIntensity, 6);
    audioEngine.playChestOpen();
    this.spawnStarBurst(ch.x, ch.y - 10, '#FBBF24', 24);

    // Roll random reward: extra stars or temporary magical power-ups
    const roll = Math.random();
    if (this.hearts < this.maxHearts && roll < 0.2) {
      this.hearts = Math.min(this.maxHearts, this.hearts + 1);
      this.starsCollected += 4;
      this.score += 65;
      this.spawnFloatingText(ch.x, ch.y - 34, 'كنز القلوب! +1 قلب و4 ★', '#E11D48');
    } else if (!this.player.shieldActive && roll < 0.45) {
      this.player.shieldActive = true;
      this.starsCollected += 4;
      this.score += 65;
      this.spawnFloatingText(ch.x, ch.y - 34, 'كنز سحري: درع اللؤلؤ!', '#E11D74');
    } else if (roll < 0.7) {
      this.player.starRushMaxTimer = 6.0;
      this.player.starRushTimer = 6.0;
      this.player.dashCooldown = 0;
      this.starsCollected += 4;
      this.score += 75;
      this.spawnFloatingText(ch.x, ch.y - 34, 'كنز سحري: السرعة الخارقة!', '#D97706');
    } else if (roll < 0.85) {
      this.player.magnetMaxTimer = 7.5;
      this.player.magnetTimer = 7.5;
      this.player.dashCooldown = 0;
      this.starsCollected += 5;
      this.score += 75;
      this.spawnFloatingText(ch.x, ch.y - 34, 'كنز سحري: مغناطيس النجوم!', '#0EA5E9');
    } else {
      this.starsCollected += 8;
      this.score += 95;
      this.spawnFloatingText(ch.x, ch.y - 34, 'كنز النجوم! +8 ★', '#B45309');
    }

    this.emitHud();
  }

  private startBossEncounter() {
    this.boss.active = true;
    this.boss.hp = 3;
    this.boss.maxHp = 3;
    this.boss.shield = 4;
    this.boss.maxShield = 4;
    this.boss.attackPattern = 0;
    this.boss.x = this.width - 115;
    this.boss.y = this.height * 0.42;
    this.boss.attackTimer = 2.0;
    this.boss.orbSpawnTimer = 2.5;
    this.boss.hitFlashTimer = 0;
    this.boss.beamTimer = 0;
    audioEngine.playBossAppear();
    this.spawnFloatingText(
      this.width * 0.5,
      this.height * 0.24,
      `مواجهة ${this.getRealm().bossName}! اجمعي النجوم لكسر درعه!`,
      '#E11D48'
    );
    this.emitHud();
  }

  private updateBoss(dt: number) {
    this.boss.x = this.width - Math.min(130, this.width * 0.16);
    this.boss.y = this.height * 0.42 + Math.sin(this.time * 2.2) * (this.height * 0.16);
    if (this.boss.hitFlashTimer > 0) this.boss.hitFlashTimer -= dt;
    if (this.boss.beamTimer > 0) this.boss.beamTimer -= dt;

    // Alternating Boss Attacks: magic orbs + moving obstacles
    this.boss.attackTimer -= dt;
    if (this.boss.attackTimer <= 0) {
      this.boss.attackPattern = (this.boss.attackPattern + 1) % 3;
      this.boss.attackTimer = 2.35;

      if (this.boss.attackPattern === 0) {
        // Direct Magic Orb
        this.hazards.push({
          id: this.nextId++,
          type: 'bossOrb',
          x: this.boss.x - 36,
          y: this.boss.y,
          baseY: this.boss.y,
          w: 36,
          h: 36,
          vx: -340,
          phase: Math.random() * Math.PI * 2,
          telegraphTimer: 0,
          zapCycle: 0,
          smashed: false,
        });
      } else if (this.boss.attackPattern === 1) {
        // Moving Magical Obstacle (Shadow Moth / Floating Thorn Barrier)
        const laneY = Math.max(
          150,
          Math.min(this.height - 135, this.height * (0.34 + Math.random() * 0.34))
        );
        this.hazards.push({
          id: this.nextId++,
          type: this.realmId === 'forest' ? 'thorn' : 'moth',
          x: this.width + 20,
          y: laneY,
          baseY: laneY,
          w: 44,
          h: 34,
          vx: -230,
          phase: Math.random() * Math.PI * 2,
          telegraphTimer: 0.7,
          zapCycle: 0,
          smashed: false,
        });
      } else {
        // Twin Staggered Magic Orbs
        for (const offset of [-52, 52]) {
          const oy = Math.max(130, Math.min(this.height - 120, this.boss.y + offset));
          this.hazards.push({
            id: this.nextId++,
            type: 'bossOrb',
            x: this.boss.x - 36,
            y: oy,
            baseY: oy,
            w: 34,
            h: 34,
            vx: -310,
            phase: Math.random() * Math.PI * 2,
            telegraphTimer: 0,
            zapCycle: 0,
            smashed: false,
          });
        }
      }
    }

    // Also spawn occasional Golden Light Orb as a bonus shield-breaker strike
    this.boss.orbSpawnTimer -= dt;
    if (this.boss.orbSpawnTimer <= 0) {
      this.boss.orbSpawnTimer = 4.2;
      const oy = Math.max(
        170,
        Math.min(this.height - 150, this.height * (0.32 + Math.random() * 0.34))
      );
      this.collectibles.push({
        id: this.nextId++,
        x: this.width - 180,
        y: oy,
        baseY: oy,
        type: 'lightOrb',
        phase: Math.random() * Math.PI * 2,
        collected: false,
      });
    }
  }

  private weakenBossShield(fromX: number, fromY: number, amount: number) {
    if (!this.boss.active) return;

    this.boss.beamTimer = 0.24;
    this.boss.beamFromX = fromX;
    this.boss.beamFromY = fromY;
    this.boss.shield -= amount;

    if (this.boss.shield <= 0) {
      this.hitBossWithLightOrb(fromX, fromY);
    } else {
      this.spawnStarBurst(this.boss.x - 28, this.boss.y, '#2DD4BF', 7);
      this.emitHud();
    }
  }

  private hitBossWithLightOrb(fromX: number, fromY: number) {
    if (!this.boss.active) {
      this.score += 40;
      return;
    }

    this.boss.hp -= 1;
    this.boss.hitFlashTimer = 0.32;
    this.boss.beamTimer = 0.28;
    this.boss.beamFromX = fromX;
    this.boss.beamFromY = fromY;
    this.hitstopTimer = 0.05;
    this.shakeIntensity = 9;
    this.score += 55;

    if (this.boss.hp <= 0) {
      const realm = this.getRealm();
      this.spawnStarBurst(this.boss.x, this.boss.y, '#FBBF24', 30);
      if (this.callbacks.onBossDefeatCapture) {
        this.flashColor = '#FFFBEB';
        this.flashAlpha = 0.14;
        this.render();
        const imageDataUrl = downscaleCanvasSnapshot(this.canvas);
        if (imageDataUrl) {
          this.callbacks.onBossDefeatCapture({
            realmId: realm.id,
            realmName: realm.name,
            bossName: realm.bossName,
            score: Math.floor(this.score + 180),
            distance: Math.floor(this.distance),
            imageDataUrl,
          });
        }
      }

      this.boss.active = false;
      this.boss.shield = 0;
      this.bossesDefeated += 1;
      this.starsCollected += 10;
      this.score += 180;
      this.nextBossDistance = this.distance + 320;
      this.hazards = this.hazards.filter((h) => h.type !== 'bossOrb');
      this.flashColor = '#FFFBEB';
      this.flashAlpha = 0.38;
      audioEngine.playBossDefeat();

      // Open Portal to the Next Level / Realm right ahead!
      const px = Math.max(this.player.x + 340, this.width * 0.72);
      const py = Math.max(170, Math.min(this.height - 170, this.lastPlatformY - 82));
      this.collectibles.push({
        id: this.nextId++,
        x: px,
        y: py,
        baseY: py,
        type: 'portal',
        phase: 0,
        collected: false,
      });

      this.spawnFloatingText(
        this.boss.x - 60,
        this.boss.y - 30,
        'انتصار! فُتحت بوابة العالم التالي!',
        '#D97706'
      );
    } else {
      this.boss.shield = this.boss.maxShield;
      audioEngine.playBossHit();
      this.spawnStarBurst(this.boss.x, this.boss.y, '#F59E0B', 16);
      this.spawnFloatingText(this.boss.x - 36, this.boss.y - 26, 'انكسر الدرع! ضربة نور!', '#F59E0B');
    }
    this.emitHud();
  }

  private damagePlayer() {
    if (this.player.shieldCharges > 0 || this.player.shieldActive) {
      const shieldStats = getShieldUpgradeStats(this.powerUpgrades.shield);
      this.player.shieldCharges = Math.max(0, this.player.shieldCharges - 1);
      this.player.shieldActive = this.player.shieldCharges > 0;
      this.player.invulnTimer = shieldStats.invulnDuration;
      if (shieldStats.blockBonusScore > 0) {
        this.score += shieldStats.blockBonusScore;
      }
      this.hitstopTimer = 0.04;
      this.shakeIntensity = 8;
      this.flashColor = '#FBCFE8';
      this.flashAlpha = 0.25;
      audioEngine.playShieldBreak();
      this.spawnStarBurst(this.player.x, this.player.y, '#F472B6', 16);
      this.spawnFloatingText(
        this.player.x,
        this.player.y - 34,
        this.player.shieldCharges > 0
          ? `درع اللؤلؤ حماكِ! (متبقي ${this.player.shieldCharges})`
          : 'درع اللؤلؤ حماكِ!',
        '#E11D74'
      );
      this.emitHud();
      return;
    }

    this.hearts -= 1;
    this.combo = 0;
    this.trickStreak = 0;
    this.trickStreakTimer = 0;
    this.player.invulnTimer = 1.5;
    this.player.vy = -340;
    this.hitstopTimer = 0.06;
    this.shakeIntensity = 11;
    this.flashColor = '#FB7185';
    this.flashAlpha = 0.34;
    audioEngine.playHurt();
    this.emitHud();

    if (this.hearts <= 0) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver() {
    this.running = false;
    if (this.timeTrialOutcome !== 'won') {
      audioEngine.playGameOver();
    }
    const finalSnapshot = this.buildHudSnapshot();
    this.callbacks.onHudUpdate(finalSnapshot);
    this.callbacks.onGameOver(finalSnapshot);
  }

  private buildHudSnapshot(): HudSnapshot {
    const realm = this.getRealm();
    const dashCharge =
      this.player.dashCooldown <= 0
        ? 1
        : Math.max(0, 1 - this.player.dashCooldown / this.player.dashMaxCooldown);
    const highJumpCharge =
      this.player.highJumpCooldown <= 0
        ? 1
        : Math.max(0, 1 - this.player.highJumpCooldown / this.player.highJumpMaxCooldown);
    return {
      realmId: this.realmId,
      realmName: realm.name,
      gameMode: this.gameMode,
      timeTrialRemaining: this.timeTrialRemaining,
      timeTrialMaxTime: this.timeTrialMaxTime,
      timeTrialTargetDistance: this.timeTrialTargetDistance,
      timeTrialOutcome: this.timeTrialOutcome,
      timeTrialRewardStars: this.timeTrialRewardStars,
      score: Math.floor(this.score),
      starsCollected: this.starsCollected,
      realmTokensCollected: this.realmTokensCollected,
      gemsCollected: this.gemsCollected,
      distance: Math.floor(this.distance),
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      combo: this.combo,
      dashCharge,
      highJumpCharge,
      isDashing: this.player.dashTimer > 0,
      magnetTimer: this.player.magnetTimer,
      magnetMaxTimer: this.player.magnetMaxTimer,
      shieldActive: this.player.shieldActive,
      shieldCharges: this.player.shieldCharges,
      starRushTimer: this.player.starRushTimer,
      starRushMaxTimer: this.player.starRushMaxTimer,
      chestsOpened: this.chestsOpened,
      portalsEntered: this.portalsEntered,
      bossesDefeated: this.bossesDefeated,
      tricksPerformed: this.tricksPerformed,
      trickStreak: this.trickStreak,
      trickStreakTarget: this.trickStreakTarget,
      secretZoneMode: this.secretZone.mode,
      secretZoneTimer: this.secretZone.timer,
      secretZoneMaxTimer: this.secretZone.maxTimer,
      bossActive: this.boss.active,
      bossName: realm.bossName,
      bossHp: this.boss.hp,
      bossMaxHp: this.boss.maxHp,
      bossShield: this.boss.shield,
      bossMaxShield: this.boss.maxShield,
      cloudsCleared: this.cloudsCleared,
      newHighScore: Math.floor(this.score) > this.bestScore,
    };
  }

  private emitHud() {
    this.callbacks.onHudUpdate(this.buildHudSnapshot());
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    maxLife: number,
    color: string,
    kind: Particle['kind'],
    additive = false,
    drag = 0,
    spin = 0
  ) {
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.size = size;
        p.life = maxLife;
        p.maxLife = maxLife;
        p.color = color;
        p.kind = kind;
        p.additive = additive;
        p.drag = drag;
        p.rotation = Math.random() * Math.PI * 2;
        p.spin = spin;
        return;
      }
    }
  }

  private emitJumpSparkles(colors: [string, string, string, string]) {
    for (let i = 0; i < 12; i++) {
      this.spawnParticle(
        this.player.x - 6 + (Math.random() - 0.5) * 24,
        this.player.y + 18,
        (Math.random() - 0.5) * 150,
        30 + Math.random() * 85,
        3.8 + Math.random() * 2.8,
        0.48,
        colors[i % colors.length],
        i % 3 === 0 ? 'aura' : 'star',
        true,
        1.2,
        (Math.random() - 0.5) * 8
      );
    }
  }

  private emitDoubleJumpSparkles(colors: [string, string, string, string]) {
    // Light expanding magic air-step rings beneath the hooves
    this.spawnParticle(
      this.player.x,
      this.player.y + 22,
      0,
      16,
      46,
      0.42,
      colors[0],
      'ring',
      true
    );
    this.spawnParticle(
      this.player.x,
      this.player.y + 22,
      0,
      12,
      30,
      0.32,
      '#FFFDF9',
      'ring',
      true
    );

    // Soft glowing crescent & wing-feather sparkles fanning sideways
    for (let i = 0; i < 14; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const spreadVx = side * (75 + Math.random() * 115);
      const spreadVy = -15 + Math.random() * 85;
      this.spawnParticle(
        this.player.x + side * 8,
        this.player.y + 12 + (Math.random() - 0.5) * 10,
        spreadVx,
        spreadVy,
        3.4 + Math.random() * 3.2,
        0.54,
        i % 4 === 0 ? '#FFFDF9' : colors[i % colors.length],
        i % 3 === 0 ? 'aura' : i % 3 === 1 ? 'star' : 'petal',
        true,
        1.6,
        (Math.random() - 0.5) * 9
      );
    }
  }

  private spawnStarBurst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 75 + Math.random() * 145;
      this.spawnParticle(
        x,
        y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd,
        3.5 + Math.random() * 3.5,
        0.52,
        color,
        i % 2 === 0 ? 'star' : 'spark',
        true,
        1.8,
        (Math.random() - 0.5) * 9
      );
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      x,
      y,
      vy: -42,
      text,
      color,
      life: 1.05,
      maxLife: 1.05,
    });
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    if (this.shakeIntensity > 0.2) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
    }

    const realm = this.getRealm();
    this.drawRealmBackdrop(ctx, realm);

    for (const p of this.platforms) {
      this.drawRealmPlatform(ctx, p, realm);
    }

    for (const ch of this.chests) {
      this.drawTreasureChest(ctx, ch);
    }

    for (const c of this.collectibles) {
      this.drawCollectible(ctx, c, realm);
    }

    for (const h of this.hazards) {
      this.drawHazard(ctx, h);
    }

    if (this.gameMode === 'timeTrial' && this.finishLineSpawned) {
      this.drawFinishLine(ctx);
    }

    if (this.boss.active) {
      this.drawBoss(ctx);
    }

    if (this.boss.beamTimer > 0) {
      ctx.save();
      ctx.globalAlpha = this.boss.beamTimer / 0.28;
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.boss.beamFromX, this.boss.beamFromY);
      ctx.lineTo(this.boss.x, this.boss.y);
      ctx.stroke();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // Luminous ribbon trail behind acrobatic tricks & dashes
    if (this.trailNodes.length >= 2) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < this.trailNodes.length; i++) {
        const a = this.trailNodes[i - 1];
        const b = this.trailNodes[i];
        const t = Math.max(0, b.life / b.maxLife);
        ctx.globalAlpha = t * 0.52;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = Math.max(2, b.width * t);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.globalAlpha = t * 0.65;
        ctx.strokeStyle = '#FFFDF9';
        ctx.lineWidth = Math.max(1, b.width * 0.35 * t);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const p of this.particles) {
      if (!p.active) continue;
      const progress = Math.max(0, p.life / p.maxLife);
      const alpha = p.kind === 'aura' ? Math.sin(progress * Math.PI) * 0.72 : progress;
      if (alpha <= 0.01) continue;
      ctx.save();
      if (p.additive) {
        ctx.globalCompositeOperation = 'lighter';
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.kind === 'star') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        this.drawTinyStar(ctx, 0, 0, p.size * (0.6 + progress * 0.4));
      } else if (p.kind === 'aura') {
        const r = p.size * (0.8 + (1 - progress) * 0.6);
        const auraGrad = ctx.createRadialGradient(p.x, p.y, 0.5, p.x, p.y, r);
        auraGrad.addColorStop(0, '#FFFFFF');
        auraGrad.addColorStop(0.4, p.color);
        auraGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'ring') {
        const expand = 0.32 + (1 - progress) * 0.88;
        const rx = p.size * expand;
        const ry = rx * 0.34;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.2, 3.2 * progress);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'petal') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 6);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Flying Companion
    drawCompanion(ctx, this.companion.x, this.companion.y, this.getCompanion(), this.time, {
      vx: this.companion.vx,
      vy: this.companion.vy,
      swooping: this.companion.swooping || this.companion.collectFlash > 0,
    });

    // Luminous afterimage speed streaks behind the dashing unicorn
    if (this.player.dashTimer > 0) {
      const maneColors = this.getMane().colors;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let g = 1; g <= 3; g++) {
        const gx = this.player.x - g * 24;
        const gy = this.player.y;
        const grad = ctx.createRadialGradient(gx, gy, 2, gx, gy, 34 - g * 4);
        grad.addColorStop(0, 'rgba(255, 253, 249, 0.55)');
        grad.addColorStop(0.5, maneColors[g % maneColors.length]);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.globalAlpha = 0.42 - g * 0.1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(gx, gy, 36 - g * 4, 20 - g * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Unicorn Hero
    const flipAngle =
      this.player.flipTimer > 0 ? ((0.42 - this.player.flipTimer) / 0.42) * Math.PI * 2 : 0;

    drawUnicorn(ctx, this.player.x, this.player.y, 66, {
      fur: this.getFur(),
      mane: this.getMane(),
      horn: this.getHorn(),
      wings: this.getWings(),
      crown: this.getCrown(),
      accessory: this.customization.accessoryId || 'none',
      time: this.time,
      scaleX: this.player.scaleX,
      scaleY: this.player.scaleY,
      tilt: this.player.tilt,
      flipRotation: flipAngle,
      gallopPhase: this.player.gallopPhase,
      wingFlap: this.player.wingFlap,
      isGrounded: this.player.grounded,
      isDashing: this.player.dashTimer > 0,
      isStarRush: this.player.starRushTimer > 0,
      shieldActive: this.player.shieldActive,
      hurtBlink: this.player.invulnTimer > 0,
      hasMagnet: this.player.magnetTimer > 0 || this.player.starRushTimer > 0,
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 18px "Baloo Bhaijaan 2", "Tajawal", sans-serif';
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    if (this.realmBannerTimer > 0) {
      const fade = Math.min(1, this.realmBannerTimer, (2.6 - this.realmBannerTimer) * 3 + 0.2);
      const bannerTitle =
        this.secretZone.mode === 'bonus'
          ? 'منطقة المكافآت الذهبية'
          : this.secretZone.mode === 'challenge'
            ? 'مستوى التحدي السحري'
            : this.gameMode === 'timeTrial'
              ? `سباق الزمن · ${realm.name}`
              : realm.name;
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade);
      ctx.font = '800 26px "Baloo Bhaijaan 2", "Tajawal", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(26, 15, 48, 0.55)';
      ctx.lineWidth = 5;
      ctx.strokeText(bannerTitle, this.width / 2, 114);
      ctx.fillStyle = '#FFFDF9';
      ctx.fillText(bannerTitle, this.width / 2, 114);
      ctx.restore();
    }

    if (this.gameMode === 'timeTrial' && this.timeTrialRemaining > 0 && this.timeTrialRemaining <= 10) {
      const urgency = 1 - this.timeTrialRemaining / 10;
      const pulse = 0.45 + 0.55 * Math.sin(this.time * (this.timeTrialRemaining <= 5 ? 11 : 6));
      const edgeAlpha = (0.12 + urgency * 0.28) * pulse;
      const edgeGrad = ctx.createRadialGradient(
        this.width / 2,
        this.height / 2,
        Math.min(this.width, this.height) * 0.3,
        this.width / 2,
        this.height / 2,
        Math.hypot(this.width, this.height) * 0.56
      );
      edgeGrad.addColorStop(0, 'rgba(225, 29, 72, 0)');
      edgeGrad.addColorStop(
        1,
        this.timeTrialRemaining <= 5
          ? `rgba(225, 29, 72, ${edgeAlpha.toFixed(3)})`
          : `rgba(245, 158, 11, ${(edgeAlpha * 0.85).toFixed(3)})`
      );
      ctx.save();
      ctx.fillStyle = edgeGrad;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    if (this.flashAlpha > 0.01) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  private drawFinishLine(ctx: CanvasRenderingContext2D) {
    const x = this.finishLineX;
    if (x < -120 || x > this.width + 140) return;

    const topY = Math.max(88, this.height * 0.16);
    const bottomY = this.height - 32;
    const gateH = bottomY - topY;

    ctx.save();

    // Soft golden beam behind finish gate
    const glow = ctx.createLinearGradient(x - 42, 0, x + 42, 0);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0)');
    glow.addColorStop(0.5, 'rgba(253, 224, 71, 0.28)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 42, topY, 84, gateH);

    // Checkered vertical ribbon strip (rose-gold & ivory)
    const sq = 14;
    const rows = Math.ceil(gateH / sq);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#FFFDF9' : '#E11D74';
        ctx.fillRect(x - sq + c * sq, topY + r * sq, sq, Math.min(sq, bottomY - (topY + r * sq)));
      }
    }

    // Twin golden poles flanking the ribbon
    ctx.fillStyle = '#D97706';
    ctx.fillRect(x - 20, topY - 12, 8, gateH + 12);
    ctx.fillRect(x + 12, topY - 12, 8, gateH + 12);
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(x - 16, topY - 14, 7, 0, Math.PI * 2);
    ctx.arc(x + 16, topY - 14, 7, 0, Math.PI * 2);
    ctx.fill();

    // Top Finish Arch Banner ("نقطة النهاية")
    const bannerW = 146;
    const bannerH = 38;
    const bx = x - bannerW / 2;
    const by = topY - 46;
    ctx.fillStyle = '#3D1D42';
    ctx.beginPath();
    ctx.roundRect(bx, by, bannerW, bannerH, 12);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FEF3C7';
    ctx.font = '800 17px "Baloo Bhaijaan 2", "Tajawal", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('نقطة النهاية', x, by + bannerH / 2 + 1);

    ctx.restore();
  }

  private drawBoss(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.boss.x, this.boss.y);
    const scale = this.boss.hitFlashTimer > 0 ? 1.12 : 1 + Math.sin(this.time * 4) * 0.04;
    ctx.scale(scale, scale);

    // Aura
    const grad = ctx.createRadialGradient(0, 0, 12, 0, 0, 68);
    grad.addColorStop(
      0,
      this.boss.hitFlashTimer > 0 ? 'rgba(251, 191, 36, 0.75)' : 'rgba(88, 28, 135, 0.45)'
    );
    grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 68, 0, Math.PI * 2);
    ctx.fill();

    // Per-realm Magical Creature Boss
    const hitFlash = this.boss.hitFlashTimer > 0;
    if (this.realmId === 'forest') {
      // Giant Shadow Owl (بومة الظل العملاقة)
      const wingFlap = Math.sin(this.time * 9) * 14;
      ctx.fillStyle = hitFlash ? '#FEF08A' : '#312E81';
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.quadraticCurveTo(-52, -32 + wingFlap, -58, 4 + wingFlap * 0.6);
      ctx.quadraticCurveTo(-30, 16, -8, 10);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(12, -4);
      ctx.quadraticCurveTo(52, -32 + wingFlap, 58, 4 + wingFlap * 0.6);
      ctx.quadraticCurveTo(30, 16, 8, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = hitFlash ? '#FEF08A' : '#4C1D95';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Owl ear tufts & glowing eyes
      ctx.beginPath();
      ctx.moveTo(-22, -22);
      ctx.lineTo(-14, -40);
      ctx.lineTo(-6, -26);
      ctx.moveTo(22, -22);
      ctx.lineTo(14, -40);
      ctx.lineTo(6, -26);
      ctx.fill();

      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(-10, -8, 6, 0, Math.PI * 2);
      ctx.arc(10, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(4, -2);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
    } else if (this.realmId === 'meadow') {
      // Giant Flying Scarab Beetle (جعل الظل الطائر)
      const wingBuzz = Math.sin(this.time * 24) * 8;
      ctx.fillStyle = 'rgba(45, 212, 191, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-28, -10 + wingBuzz * 0.5, 26, 11, -0.35, 0, Math.PI * 2);
      ctx.ellipse(28, -10 + wingBuzz * 0.5, 26, 11, 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hitFlash ? '#FEF08A' : '#115E59';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 2, 28, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Scarab Horns
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, -24);
      ctx.quadraticCurveTo(-18, -42, -6, -44);
      ctx.moveTo(10, -24);
      ctx.quadraticCurveTo(18, -42, 6, -44);
      ctx.stroke();

      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(-10, -8, 5, 0, Math.PI * 2);
      ctx.arc(10, -8, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.realmId === 'egypt') {
      // Guardian Sphinx (أبو الهول الحارس)
      ctx.fillStyle = hitFlash ? '#FEF08A' : '#B45309';
      ctx.beginPath();
      ctx.moveTo(-34, 20);
      ctx.lineTo(-22, -26);
      ctx.lineTo(22, -26);
      ctx.lineTo(34, 20);
      ctx.closePath();
      ctx.fill();

      // Turquoise & Gold Nemes Stripes
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-26, -6);
      ctx.lineTo(26, -6);
      ctx.moveTo(-29, 6);
      ctx.lineTo(29, 6);
      ctx.stroke();

      ctx.fillStyle = hitFlash ? '#FFFBEB' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, -10, 20, 0, Math.PI * 2);
      ctx.fill();

      // Cobra Crest & Glowing Eyes
      ctx.fillStyle = '#0D9488';
      ctx.beginPath();
      ctx.arc(0, -32, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-8, -12, 4.5, 0, Math.PI * 2);
      ctx.arc(8, -12, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.realmId === 'qatar') {
      // Falcon of the Dunes (صقر الكثبان السحري)
      const wingFlap = Math.sin(this.time * 10) * 16;
      ctx.fillStyle = hitFlash ? '#FEF08A' : '#8D1B3D';
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.quadraticCurveTo(-56, -34 + wingFlap, -62, 6 + wingFlap * 0.6);
      ctx.quadraticCurveTo(-28, 16, -6, 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -4);
      ctx.quadraticCurveTo(56, -34 + wingFlap, 62, 6 + wingFlap * 0.6);
      ctx.quadraticCurveTo(28, 16, 6, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = hitFlash ? '#FFFBEB' : '#D97706';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-9, -8, 5, 0, Math.PI * 2);
      ctx.arc(9, -8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-5, -1);
      ctx.lineTo(5, -1);
      ctx.lineTo(0, 9);
      ctx.closePath();
      ctx.fill();
    } else if (this.realmId === 'turkey') {
      // Bosphorus Phoenix (عنقاء البوسفور)
      const wingFlap = Math.sin(this.time * 11) * 15;
      ctx.fillStyle = hitFlash ? '#FEF08A' : '#E11D48';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(-56, -38 + wingFlap, -60, 8 + wingFlap * 0.5);
      ctx.quadraticCurveTo(-30, 20, -6, 10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(56, -38 + wingFlap, 60, 8 + wingFlap * 0.5);
      ctx.quadraticCurveTo(30, 20, 6, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = hitFlash ? '#FFFBEB' : '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(0, 0, 23, 29, 0, 0, Math.PI * 2);
      ctx.fill();
      // Feather crown
      ctx.fillStyle = '#BE123C';
      for (const ox of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.ellipse(ox, -32, 4, 10, ox * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-8, -8, 4.5, 0, Math.PI * 2);
      ctx.arc(8, -8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.realmId === 'pharaohs') {
      // Golden Horus Solar Guardian (حورس الذهبي الحارس)
      const wingFlap = Math.sin(this.time * 10) * 14;
      ctx.fillStyle = hitFlash ? '#FFFBEB' : '#0D9488';
      ctx.beginPath();
      ctx.moveTo(-12, -2);
      ctx.quadraticCurveTo(-58, -36 + wingFlap, -64, 10 + wingFlap * 0.5);
      ctx.quadraticCurveTo(-30, 18, -6, 10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, -2);
      ctx.quadraticCurveTo(58, -36 + wingFlap, 64, 10 + wingFlap * 0.5);
      ctx.quadraticCurveTo(30, 18, 6, 10);
      ctx.closePath();
      ctx.fill();

      // Solar Disk Halo behind head
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(0, -34, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hitFlash ? '#FEF08A' : '#D97706';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-8, -8, 4.5, 0, Math.PI * 2);
      ctx.arc(8, -8, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-5, -1);
      ctx.lineTo(5, -1);
      ctx.lineTo(0, 9);
      ctx.closePath();
      ctx.fill();
    } else {
      // Storm Cloud King (ملك الغيوم الرعدية)
      ctx.fillStyle = hitFlash ? '#FEF08A' : '#4C1D95';
      for (const pf of [
        { x: -24, y: 8, r: 22 },
        { x: 0, y: -6, r: 30 },
        { x: 24, y: 8, r: 22 },
      ]) {
        ctx.beginPath();
        ctx.arc(pf.x, pf.y, pf.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-14, -30);
      ctx.lineTo(-10, -45);
      ctx.lineTo(0, -34);
      ctx.lineTo(10, -45);
      ctx.lineTo(14, -30);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(-11, -2, 5, 0, Math.PI * 2);
      ctx.arc(11, -2, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Boss Magical Shield Dome (weakens as Talia collects stars)
    if (this.boss.shield > 0) {
      const ratio = this.boss.shield / Math.max(1, this.boss.maxShield);
      ctx.save();
      ctx.fillStyle = `rgba(45, 212, 191, ${0.12 + ratio * 0.14})`;
      ctx.strokeStyle = `rgba(94, 234, 212, ${0.45 + ratio * 0.45})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Windup warning ring before boss fires magic orb or moving obstacle
    if (this.boss.attackTimer < 0.75) {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-44, 0, 14 * (1 - this.boss.attackTimer / 0.75) + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawRealmBackdrop(ctx: CanvasRenderingContext2D, realm: RealmDefinition) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (this.secretZone.mode === 'bonus') {
      grad.addColorStop(0, '#4A1259');
      grad.addColorStop(0.52, '#9D174D');
      grad.addColorStop(1, '#FDE68A');
    } else if (this.secretZone.mode === 'challenge') {
      grad.addColorStop(0, '#042F2E');
      grad.addColorStop(0.55, '#115E59');
      grad.addColorStop(1, '#4C1D95');
    } else {
      grad.addColorStop(0, realm.skyTop);
      grad.addColorStop(0.55, realm.skyMid);
      grad.addColorStop(1, realm.skyBottom);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    const starVis = this.secretZone.mode !== 'none' ? 0.9 : realm.starOpacity;
    for (const s of this.bgStars) {
      const alpha =
        starVis * (0.45 + 0.55 * Math.sin(this.time * s.twinkleSpeed + s.phase));
      if (alpha <= 0.02) continue;
      ctx.fillStyle =
        this.realmId === 'forest'
          ? `rgba(167, 243, 208, ${alpha})`
          : `rgba(255, 252, 235, ${alpha})`;
      ctx.beginPath();
      const fx =
        this.realmId === 'forest'
          ? ((s.x * this.width - this.time * 18 + Math.sin(this.time + s.phase) * 14) %
              this.width +
              this.width) %
            this.width
          : s.x * this.width;
      const fy =
        this.realmId === 'forest'
          ? s.y * this.height + Math.cos(this.time * 2 + s.phase) * 10
          : s.y * this.height;
      ctx.arc(fx, fy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const orbX = this.width * 0.78;
    const orbY = this.height * 0.2;
    const orbGlow = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, 130);
    if (this.realmId === 'forest') {
      orbGlow.addColorStop(0, 'rgba(209, 250, 229, 0.92)');
      orbGlow.addColorStop(0.45, 'rgba(94, 234, 212, 0.28)');
      orbGlow.addColorStop(1, 'rgba(94, 234, 212, 0)');
    } else if (this.realmId === 'qatar') {
      orbGlow.addColorStop(0, 'rgba(255, 251, 235, 0.96)');
      orbGlow.addColorStop(0.45, 'rgba(251, 191, 36, 0.34)');
      orbGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else {
      orbGlow.addColorStop(0, 'rgba(255, 248, 225, 0.94)');
      orbGlow.addColorStop(0.4, 'rgba(255, 224, 178, 0.36)');
      orbGlow.addColorStop(1, 'rgba(255, 224, 178, 0)');
    }
    ctx.fillStyle = orbGlow;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 130, 0, Math.PI * 2);
    ctx.fill();

    // Cappadocia hot air balloons drifting in Turkish sky
    if (this.realmId === 'turkey' && this.secretZone.mode === 'none') {
      const balloonPalette = [
        ['#E11D48', '#FDE047'],
        ['#0284C7', '#FFFDF9'],
        ['#F59E0B', '#BE185D'],
        ['#0D9488', '#FDE68A'],
      ];
      for (let i = 0; i < 4; i++) {
        const bx =
          (((this.width * (0.2 + i * 0.24) - this.distance * (0.7 + i * 0.15)) %
            (this.width + 180)) +
            (this.width + 180)) %
            (this.width + 180) -
          90;
        const by = this.height * (0.19 + (i % 2) * 0.13) + Math.sin(this.time * 1.4 + i) * 10;
        const [c1, c2] = balloonPalette[i % balloonPalette.length];
        ctx.save();
        ctx.translate(bx, by);
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6, 18);
        ctx.lineTo(-4, 27);
        ctx.moveTo(6, 18);
        ctx.lineTo(4, 27);
        ctx.stroke();
        ctx.fillStyle = '#92400E';
        ctx.fillRect(-5, 27, 10, 7);
        ctx.restore();
      }
    }

    this.drawParallaxLayer(ctx, realm.farLayerColor, 0.08, this.height * 0.78, 66, true);
    this.drawParallaxLayer(ctx, realm.nearLayerColor, 0.16, this.height * 0.88, 48, false);
  }

  private drawParallaxLayer(
    ctx: CanvasRenderingContext2D,
    color: string,
    speedFactor: number,
    baseY: number,
    amp: number,
    withLandmarks: boolean
  ) {
    const offset = (this.distance * speedFactor * 26) % 420;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let x = -420; x <= this.width + 420; x += 70) {
      const px = x - offset;
      const hillY = baseY - Math.abs(Math.sin((x + 120) * 0.008)) * amp;
      ctx.lineTo(px, hillY);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();

    if (withLandmarks) {
      for (let x = -420; x <= this.width + 420; x += 420) {
        const sx = x - offset + 180;
        const sy = baseY - amp * 0.65;
        if (this.realmId === 'forest') {
          ctx.beginPath();
          ctx.moveTo(sx, sy - 84);
          ctx.lineTo(sx - 28, sy - 20);
          ctx.lineTo(sx - 12, sy - 20);
          ctx.lineTo(sx - 34, sy + 20);
          ctx.lineTo(sx + 34, sy + 20);
          ctx.lineTo(sx + 12, sy - 20);
          ctx.lineTo(sx + 28, sy - 20);
          ctx.closePath();
          ctx.fill();
        } else if (this.realmId === 'meadow') {
          ctx.fillRect(sx - 6, sy - 58, 12, 78);
          ctx.beginPath();
          ctx.arc(sx, sy - 60, 22, Math.PI, 0);
          ctx.fill();
        } else if (this.realmId === 'egypt') {
          // Great & Companion Pyramids of Giza + Nile Palm
          ctx.beginPath();
          ctx.moveTo(sx - 78, sy + 30);
          ctx.lineTo(sx - 20, sy - 64);
          ctx.lineTo(sx + 38, sy + 30);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(sx + 24, sy + 30);
          ctx.lineTo(sx + 66, sy - 38);
          ctx.lineTo(sx + 108, sy + 30);
          ctx.closePath();
          ctx.fill();
        } else if (this.realmId === 'qatar') {
          // Traditional Qatari Dhow Sail + Doha Torch Tower Silhouette
          ctx.beginPath();
          ctx.moveTo(sx - 46, sy + 24);
          ctx.quadraticCurveTo(sx - 42, sy - 48, sx - 8, sy - 68);
          ctx.lineTo(sx - 18, sy + 24);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(sx + 54, sy - 20, 14, 52, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.realmId === 'turkey') {
          // Istanbul Mosque Dome & Slender Minaret + Cappadocia Fairy Chimney
          ctx.beginPath();
          ctx.arc(sx, sy - 6, 32, Math.PI, 0);
          ctx.lineTo(sx + 32, sy + 28);
          ctx.lineTo(sx - 32, sy + 28);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(sx - 46, sy - 58, 8, 86);
          ctx.beginPath();
          ctx.moveTo(sx - 48, sy - 58);
          ctx.lineTo(sx - 42, sy - 76);
          ctx.lineTo(sx - 36, sy - 58);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(sx + 40, sy - 52, 8, 80);
          ctx.beginPath();
          ctx.moveTo(sx + 38, sy - 52);
          ctx.lineTo(sx + 44, sy - 70);
          ctx.lineTo(sx + 50, sy - 52);
          ctx.closePath();
          ctx.fill();
        } else if (this.realmId === 'pharaohs') {
          // Ancient Egyptian Temple Columns + Obelisk + Pyramids
          ctx.beginPath();
          ctx.moveTo(sx - 68, sy + 28);
          ctx.lineTo(sx - 18, sy - 58);
          ctx.lineTo(sx + 32, sy + 28);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(sx + 48, sy + 28);
          ctx.lineTo(sx + 53, sy - 54);
          ctx.lineTo(sx + 60, sy - 70);
          ctx.lineTo(sx + 67, sy - 54);
          ctx.lineTo(sx + 72, sy + 28);
          ctx.closePath();
          ctx.fill();

          ctx.fillRect(sx - 102, sy - 38, 14, 66);
          ctx.beginPath();
          ctx.ellipse(sx - 95, sy - 42, 14, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(sx - 18, sy + 20);
          ctx.lineTo(sx - 12, sy - 42);
          ctx.lineTo(sx, sy - 76);
          ctx.lineTo(sx + 12, sy - 42);
          ctx.lineTo(sx + 18, sy + 20);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  private drawRealmPlatform(ctx: CanvasRenderingContext2D, p: Platform, realm: RealmDefinition) {
    ctx.save();
    const squashY = p.bounceTimer > 0 ? Math.sin((p.bounceTimer / 0.25) * Math.PI) * 6 : 0;
    ctx.translate(p.x, p.y + squashY);

    if (this.realmId === 'forest') {
      ctx.fillStyle = '#4A332D';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, 0, p.w, 22, 11);
      ctx.fill();
      ctx.fillStyle = p.type === 'bouncy' ? '#F472B6' : '#6EE7B7';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2 - 4, -6, p.w + 8, 13, 8);
      ctx.fill();
      if (p.type === 'bouncy') {
        for (const mx of [-p.w * 0.2, 0, p.w * 0.2]) {
          ctx.fillStyle = '#FFF1F2';
          ctx.fillRect(mx - 3, -12, 6, 8);
          ctx.fillStyle = '#E11D74';
          ctx.beginPath();
          ctx.arc(mx, -12, 9, Math.PI, 0);
          ctx.fill();
        }
      }
    } else if (this.realmId === 'meadow') {
      ctx.fillStyle = '#65A30D';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, 0, p.w, 20, 10);
      ctx.fill();
      ctx.fillStyle = p.type === 'bouncy' ? '#FBCFE8' : '#BEF264';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2 - 3, -5, p.w + 6, 12, 8);
      ctx.fill();
      const flowerXs = [-p.w * 0.26, 0, p.w * 0.26];
      for (const fx of flowerXs) {
        ctx.fillStyle = p.type === 'bouncy' ? '#E11D74' : '#F472B6';
        ctx.beginPath();
        ctx.arc(fx, -8, p.type === 'bouncy' ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(fx, -8, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.realmId === 'egypt') {
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, 0, p.w, 22, 8);
      ctx.fill();
      ctx.fillStyle = p.type === 'bouncy' ? '#FDE68A' : '#FEF3C7';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2 - 3, -5, p.w + 6, 13, 6);
      ctx.fill();
      // Turquoise Egyptian trim dots
      ctx.fillStyle = p.type === 'bouncy' ? '#E11D74' : '#0D9488';
      for (let gx = -p.w * 0.35; gx <= p.w * 0.35; gx += 26) {
        ctx.fillRect(gx - 4, 2, 8, 4);
      }
    } else if (this.realmId === 'qatar') {
      ctx.fillStyle = '#8D1B3D';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, 0, p.w, 22, 10);
      ctx.fill();
      ctx.fillStyle = p.type === 'bouncy' ? '#FBCFE8' : '#FFFBEB';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2 - 3, -5, p.w + 6, 12, 8);
      ctx.fill();
      // Sadu geometric diamond trim
      ctx.fillStyle = p.type === 'bouncy' ? '#E11D74' : '#F59E0B';
      for (let dx = -p.w * 0.32; dx <= p.w * 0.32; dx += 28) {
        ctx.beginPath();
        ctx.moveTo(dx, -2);
        ctx.lineTo(dx + 5, 3);
        ctx.lineTo(dx, 8);
        ctx.lineTo(dx - 5, 3);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.realmId === 'turkey') {
      ctx.fillStyle = '#0369A1';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, 0, p.w, 22, 10);
      ctx.fill();
      ctx.fillStyle = p.type === 'bouncy' ? '#FFE4E6' : '#FFFDF9';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2 - 3, -5, p.w + 6, 12, 8);
      ctx.fill();
      // Iznik turquoise & crimson dots
      for (let ix = -p.w * 0.32, k = 0; ix <= p.w * 0.32; ix += 24, k++) {
        ctx.fillStyle = k % 2 === 0 ? '#E11D48' : '#0EA5E9';
        ctx.beginPath();
        ctx.arc(ix, 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.realmId === 'pharaohs') {
      // Golden Sandstone & Sparkling Sand Rim Platform
      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, 0, p.w, 24, 7);
      ctx.fill();
      ctx.fillStyle = p.type === 'bouncy' ? '#FDE047' : '#FEF08A';
      ctx.beginPath();
      ctx.roundRect(-p.w / 2 - 3, -5, p.w + 6, 13, 6);
      ctx.fill();
      for (let hx = -p.w * 0.36, idx = 0; hx <= p.w * 0.36; hx += 22, idx++) {
        ctx.fillStyle = idx % 2 === 0 ? '#0D9488' : '#D97706';
        ctx.fillRect(hx - 4, 2, 8, 5);
      }
    } else {
      ctx.fillStyle = p.type === 'bouncy' ? '#FBCFE8' : realm.platformShadow;
      for (const puff of p.puffs) {
        ctx.beginPath();
        ctx.arc(puff.ox, puff.oy + 7, puff.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = p.type === 'bouncy' ? realm.bouncyColor : realm.platformMain;
      for (const puff of p.puffs) {
        ctx.beginPath();
        ctx.arc(puff.ox, puff.oy, puff.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (p.type === 'bouncy') {
        ctx.strokeStyle = '#F472B6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-p.w * 0.36, -8);
        ctx.quadraticCurveTo(0, -16, p.w * 0.36, -8);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawCollectible(ctx: CanvasRenderingContext2D, c: Collectible, realm: RealmDefinition) {
    ctx.save();
    ctx.translate(c.x, c.y);

    if (c.type === 'star') {
      const pulse = 1 + Math.sin(this.time * 6 + c.phase) * 0.1;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FBBF24';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      this.drawTinyStar(ctx, 0, 0, 13, true);
    } else if (c.type === 'realmToken') {
      const pulse = 1 + Math.sin(this.time * 5 + c.phase) * 0.1;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = `${realm.accentColor}33`;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      if (this.realmId === 'forest') {
        ctx.fillStyle = '#0F766E';
        ctx.beginPath();
        ctx.roundRect(-8, -11, 16, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#A7F3D0';
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.realmId === 'meadow') {
        ctx.fillStyle = '#E11D74';
        for (let a = -1; a <= 1; a++) {
          ctx.save();
          ctx.rotate(a * 0.45);
          ctx.beginPath();
          ctx.ellipse(0, -4, 5, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.realmId === 'egypt') {
        // Golden Egyptian Papyrus Blossom
        ctx.fillStyle = '#0D9488';
        ctx.fillRect(-2, 0, 4, 14);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(-11, 2);
        ctx.quadraticCurveTo(0, -16, 11, 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (this.realmId === 'qatar') {
        // Glowing Gulf Pearl in Open Shell
        ctx.fillStyle = '#9D174D';
        ctx.beginPath();
        ctx.arc(0, 3, 12, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#FFFBEB';
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, -1, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (this.realmId === 'turkey') {
        // Crimson & Gold Istanbul Tulip
        ctx.fillStyle = '#059669';
        ctx.fillRect(-1.5, 3, 3, 11);
        ctx.fillStyle = '#E11D48';
        ctx.beginPath();
        ctx.moveTo(-9, -6);
        ctx.lineTo(-4, -12);
        ctx.lineTo(0, -5);
        ctx.lineTo(4, -12);
        ctx.lineTo(9, -6);
        ctx.quadraticCurveTo(9, 7, 0, 7);
        ctx.quadraticCurveTo(-9, 7, -9, -6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.realmId === 'pharaohs') {
        // Golden Egyptian Ankh (عنخ الحياة السحري) with Turquoise Gem
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(0, -7, 6, 7.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-10, 2);
        ctx.lineTo(10, 2);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 14);
        ctx.stroke();
        ctx.fillStyle = '#0D9488';
        ctx.beginPath();
        ctx.arc(0, -7, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.rotate(-0.4);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFBEB';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(0, 13);
        ctx.stroke();
      }
    } else if (c.type === 'gem') {
      ctx.rotate(Math.sin(this.time * 4 + c.phase) * 0.12);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(13, -3);
      ctx.lineTo(0, 15);
      ctx.lineTo(-13, -3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (c.type === 'heart') {
      const beat = 1 + Math.sin(this.time * 7 + c.phase) * 0.11;
      ctx.scale(beat, beat);
      ctx.fillStyle = 'rgba(225, 29, 72, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E11D48';
      ctx.strokeStyle = '#9F1239';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.bezierCurveTo(-15, 2, -15, -12, -6, -12);
      ctx.bezierCurveTo(-2, -12, 0, -8, 0, -6);
      ctx.bezierCurveTo(0, -8, 2, -12, 6, -12);
      ctx.bezierCurveTo(15, -12, 15, 2, 0, 11);
      ctx.fill();
      ctx.stroke();
    } else if (c.type === 'shield') {
      const p = 1 + Math.sin(this.time * 6) * 0.08;
      ctx.scale(p, p);
      ctx.fillStyle = 'rgba(244, 114, 182, 0.26)';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FBCFE8';
      ctx.strokeStyle = '#E11D74';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-4, -4, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.type === 'starRush') {
      ctx.rotate(this.time * 3);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      this.drawTinyStar(ctx, 0, 0, 15, true);
    } else if (c.type === 'chest') {
      // Golden Treasure Chest
      ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#B45309';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-18, -12, 36, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-18, -2, 36, 5);
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.type === 'portal') {
      // Next Level / Realm Portal Ring opened by defeating Boss
      ctx.fillStyle = 'rgba(45, 212, 191, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, 40 + Math.sin(this.time * 5) * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '700 13px "Tajawal", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 3;
      ctx.strokeText('بوابة المستوى التالي', 0, -42);
      ctx.fillStyle = '#0F766E';
      ctx.fillText('بوابة المستوى التالي', 0, -42);

      ctx.save();
      ctx.rotate(this.time * 2.5);
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 32, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(45, 212, 191, 0.38)';
      ctx.fill();
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (c.type === 'secretPortal') {
      const isBonus = c.portalMode !== 'challenge';
      const outerColor = isBonus ? '#F59E0B' : '#0D9488';
      const innerColor = isBonus ? 'rgba(251, 191, 36, 0.38)' : 'rgba(45, 212, 191, 0.38)';
      const rimGlow = isBonus ? '#E11D74' : '#7E22CE';

      // Radiant backdrop halo
      ctx.fillStyle = isBonus ? 'rgba(251, 191, 36, 0.24)' : 'rgba(45, 212, 191, 0.24)';
      ctx.beginPath();
      ctx.arc(0, 0, 42 + Math.sin(this.time * 6) * 4, 0, Math.PI * 2);
      ctx.fill();

      // Label above portal
      ctx.font = '700 13px "Tajawal", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      const label = isBonus ? 'بوابة المكافآت' : 'بوابة التحدي';
      ctx.strokeText(label, 0, -44);
      ctx.fillStyle = rimGlow;
      ctx.fillText(label, 0, -44);

      // Swirling secret gateway
      ctx.save();
      ctx.rotate(this.time * 2.2);
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 34, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = innerColor;
      ctx.fill();

      ctx.strokeStyle = rimGlow;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 24, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Orbiting sparkles
      for (let k = 0; k < 3; k++) {
        const ang = this.time * 4 + (k * Math.PI * 2) / 3;
        ctx.fillStyle = '#FEF08A';
        this.drawTinyStar(ctx, Math.cos(ang) * 29, Math.sin(ang) * 38, 4.5);
      }
    } else if (c.type === 'lightOrb') {
      const p = 1 + Math.sin(this.time * 10) * 0.14;
      ctx.scale(p, p);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawTreasureChest(ctx: CanvasRenderingContext2D, ch: TreasureChest) {
    ctx.save();
    const bounce =
      !ch.opened && ch.nearGlow > 0.05 ? Math.sin(this.time * 16) * 2.5 * ch.nearGlow : 0;
    ctx.translate(ch.x, ch.y + bounce);

    // Golden beam when opened
    if (ch.opened) {
      const beamAlpha = Math.max(0, 1 - ch.openAnim * 0.45) * 0.48;
      const beamGrad = ctx.createLinearGradient(0, 0, 0, -90);
      beamGrad.addColorStop(0, `rgba(253, 224, 71, ${beamAlpha})`);
      beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.lineTo(-34, -90);
      ctx.lineTo(34, -90);
      ctx.lineTo(16, -6);
      ctx.closePath();
      ctx.fill();
    } else {
      // Proximity glow halo
      const glowRadius = 28 + ch.nearGlow * 12 + Math.sin(this.time * 5) * 3;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.24 + ch.nearGlow * 0.25})`;
      ctx.beginPath();
      ctx.arc(0, -4, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chest base box
    ctx.fillStyle = '#92400E';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-20, -6, 40, 22, 5);
    ctx.fill();
    ctx.stroke();

    // Vertical golden straps on base
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-13, -6, 5, 22);
    ctx.fillRect(8, -6, 5, 22);

    // Hinged lid (swings open smoothly)
    ctx.save();
    ctx.translate(-20, -6);
    ctx.rotate(-ch.openAnim * 1.15);
    ctx.fillStyle = '#B45309';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, -13, 40, 14, [8, 8, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Golden clasp
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(20, -1, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  private drawHazard(ctx: CanvasRenderingContext2D, h: Hazard) {
    ctx.save();
    if (h.smashed) {
      ctx.globalAlpha = 0.42;
    }

    if (h.type === 'moth' && h.telegraphTimer > 0) {
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(this.width - 42, h.baseY);
      ctx.lineTo(this.width * 0.35, h.baseY);
      ctx.stroke();
      ctx.setLineDash([]);

      const pulse = 1 + Math.sin(this.time * 22) * 0.12;
      ctx.translate(this.width - 30, h.baseY);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 18px "Tajawal", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 1);
      ctx.restore();
      return;
    }

    ctx.translate(h.x, h.y);

    if (h.type === 'bossOrb') {
      ctx.fillStyle = 'rgba(126, 34, 206, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6B21A8';
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (h.type === 'storm') {
      const windup = h.zapCycle > 1.75;
      ctx.fillStyle = windup ? '#4C3575' : '#58447A';
      for (const pf of [
        { x: -18, y: 4, r: 16 },
        { x: 0, y: -4, r: 21 },
        { x: 18, y: 4, r: 16 },
      ]) {
        ctx.beginPath();
        ctx.arc(pf.x, pf.y, pf.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(-8, 1, 3, 0, Math.PI * 2);
      ctx.arc(8, 1, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#2A1845';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-13, -4);
      ctx.lineTo(-4, -1);
      ctx.moveTo(13, -4);
      ctx.lineTo(4, -1);
      ctx.stroke();

      if (windup) {
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-4, 18);
        ctx.lineTo(-10, 29);
        ctx.lineTo(-2, 29);
        ctx.lineTo(-7, 42);
        ctx.stroke();
      }
    } else if (h.type === 'moth') {
      const wingY = Math.sin(this.time * 24) * 9;
      ctx.fillStyle = '#4C1D95';
      ctx.beginPath();
      ctx.ellipse(2, -4 + wingY * 0.5, 16, 9, -0.4, 0, Math.PI * 2);
      ctx.ellipse(2, 6 - wingY * 0.5, 14, 8, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1E1B4B';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(-7, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (h.type === 'miniPyramid') {
      // Miniature Stepped Golden Pyramid Obstacle (الأهرامات المصغرة)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 2, 26, 0, Math.PI * 2);
      ctx.fill();

      // Main sandstone pyramid body
      ctx.fillStyle = '#B45309';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-22, 16);
      ctx.lineTo(0, -20);
      ctx.lineTo(22, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shaded side facet
      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(22, 16);
      ctx.lineTo(4, 16);
      ctx.closePath();
      ctx.fill();

      // Carved stone brick lines
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-11, -1);
      ctx.lineTo(11, -1);
      ctx.moveTo(-16, 8);
      ctx.lineTo(16, 8);
      ctx.stroke();

      // Gleaming Gold Capstone (Benben)
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(0, -20);
      ctx.lineTo(6, -10);
      ctx.closePath();
      ctx.fill();
    } else if (h.type === 'thorn') {
      ctx.rotate(this.time * 1.4 + h.phase);
      ctx.fillStyle = '#6D28D9';
      ctx.strokeStyle = '#C4B5FD';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(0, -21);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawTinyStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    stroke = false
  ) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.46;
      const ang = (i * Math.PI) / 5 - Math.PI / 2;
      const sx = x + Math.cos(ang) * rad;
      const sy = y + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    if (stroke) ctx.stroke();
  }
}
