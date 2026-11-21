class UnicornAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private speedWindGain: GainNode | null = null;
  private speedWindFilter: BiquadFilterNode | null = null;
  private windStarted = false;

  private muted = false;
  private speedFactor = 0; // 0 (base speed) .. 1.25 (max sprint / dash)
  private speedLayerActive = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.03);
    }
    this.syncSpeedWind();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setSpeedActive(active: boolean) {
    this.speedLayerActive = active;
    this.syncSpeedWind();
  }

  public setSpeedFactor(currentSpeed: number) {
    // 315 is base scroll speed; rises smoothly up to ~700+ during star rush / dash
    const normalized = Math.max(0, Math.min(1.25, (currentSpeed - 315) / 340));
    this.speedFactor = normalized;
    this.syncSpeedWind();
  }

  private getPitchScale(): number {
    return 1 + this.speedFactor * 0.24;
  }

  private getVolScale(): number {
    return 1 + this.speedFactor * 0.38;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.windStarted) {
      this.initSpeedWindLayer();
    }
    return this.ctx;
  }

  private initSpeedWindLayer() {
    if (!this.ctx || !this.masterGain || this.windStarted) return;
    this.windStarted = true;

    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(480, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    this.speedWindFilter = filter;
    this.speedWindGain = gain;
  }

  private syncSpeedWind() {
    if (!this.ctx || !this.speedWindGain || !this.speedWindFilter) return;
    const now = this.ctx.currentTime;
    if (this.muted || !this.speedLayerActive || this.speedFactor < 0.08) {
      this.speedWindGain.gain.setTargetAtTime(0.0001, now, 0.08);
      return;
    }
    const targetGain = Math.min(0.036, 0.005 + this.speedFactor * 0.025);
    const targetFreq = 460 + this.speedFactor * 1150;
    this.speedWindGain.gain.setTargetAtTime(targetGain, now, 0.09);
    this.speedWindFilter.frequency.setTargetAtTime(targetFreq, now, 0.09);
  }

  public unlock() {
    this.ensureContext();
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.14,
    delay = 0,
    scaleWithSpeed = true
  ) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const pitchScale = scaleWithSpeed ? this.getPitchScale() : 1;
    const volScale = scaleWithSpeed ? this.getVolScale() : 1;
    const fStart = Math.max(20, freq * pitchScale);
    const fEnd = Math.max(20, endFreq * pitchScale);
    const vol = Math.min(0.32, volume * volScale);

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(fStart, now);
    if (fEnd !== fStart) {
      osc.frequency.exponentialRampToValueAtTime(fEnd, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playShimmerNote(freq: number, duration: number, volume = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const pitchScale = this.getPitchScale();
    const volScale = this.getVolScale();
    const now = ctx.currentTime + delay;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(750 + this.speedFactor * 550, now);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq * 2 * pitchScale, now);
    osc2.frequency.setValueAtTime(freq * 3 * pitchScale, now);

    const targetVol = Math.min(0.2, volume * volScale);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetVol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.02);
    osc2.stop(now + duration + 0.02);
  }

  private playNoiseSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      ch[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.6, ctx.currentTime + delay);

    const pitchScale = this.getPitchScale();
    const now = ctx.currentTime + delay;
    filter.frequency.setValueAtTime(startFreq * pitchScale, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq * pitchScale), now + duration);

    const gain = ctx.createGain();
    const targetVol = Math.min(0.22, volume * this.getVolScale());
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetVol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start(now);
    src.stop(now + duration + 0.02);
  }

  public playJump(isDouble: boolean) {
    if (isDouble) {
      this.playTone(460, 780, 0.16, 'triangle', 0.13);
      this.playTone(720, 1040, 0.14, 'sine', 0.09, 0.04);
    } else {
      this.playTone(340, 560, 0.15, 'triangle', 0.13);
    }
  }

  public playHighJump() {
    this.playNoiseSweep(420, 2400, 0.24, 0.07, 0);
    this.playTone(392, 987.77, 0.24, 'triangle', 0.15);
    this.playTone(587.33, 1318.51, 0.22, 'sine', 0.11, 0.04);
    this.playShimmerNote(783.99, 0.26, 0.06, 0.05);
  }

  public playTrick() {
    this.playTone(587.33, 880, 0.12, 'triangle', 0.12);
    this.playTone(880, 1318.5, 0.14, 'sine', 0.1, 0.05);
    this.playShimmerNote(659.25, 0.16, 0.045, 0.03);
  }

  public playBounce() {
    this.playTone(280, 720, 0.22, 'sine', 0.15);
    this.playTone(540, 880, 0.18, 'triangle', 0.1, 0.05);
  }

  public playStarPickup(combo: number) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const idx = Math.min(scale.length - 1, Math.max(0, combo - 1));
    const base = scale[idx];
    this.playTone(base, base * 1.03, 0.17, 'sine', 0.12);
    this.playTone(base * 1.5, base * 1.52, 0.13, 'triangle', 0.06, 0.025);
    // New crystalline sparkle overtone layer scaling with speed
    this.playShimmerNote(base, 0.15, 0.045 + this.speedFactor * 0.02, 0.02);
  }

  public playGemPickup() {
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((n, i) => {
      this.playTone(n, n, 0.2, 'sine', 0.11, i * 0.045);
    });
    // Magnetic crystalline shimmer sweep layer
    this.playNoiseSweep(900, 3200, 0.24, 0.055, 0.02);
    this.playShimmerNote(987.77, 0.26, 0.06, 0.08);
  }

  public playHeartPickup() {
    this.playTone(523.25, 523.25, 0.24, 'triangle', 0.13, 0);
    this.playTone(659.25, 659.25, 0.26, 'sine', 0.12, 0.07);
    this.playTone(783.99, 1046.5, 0.3, 'sine', 0.13, 0.14);
  }

  public playChestOpen() {
    // Tactile golden latch pop + sparkling air puff
    this.playTone(260, 420, 0.07, 'triangle', 0.14, 0);
    this.playNoiseSweep(700, 2800, 0.18, 0.06, 0.02);
    // Cascading treasure arpeggio
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    fanfare.forEach((n, i) => {
      this.playTone(n, n * 1.02, 0.22, 'triangle', 0.11, 0.04 + i * 0.05);
    });
    // Celebratory harmonic chord shimmer
    this.playShimmerNote(523.25, 0.36, 0.06, 0.16);
    this.playShimmerNote(783.99, 0.36, 0.05, 0.2);
  }

  public playPortalWarp() {
    this.playNoiseSweep(450, 2600, 0.32, 0.07, 0);
    this.playTone(392, 987.77, 0.34, 'sine', 0.14);
    this.playTone(587.33, 1318.51, 0.32, 'triangle', 0.1, 0.06);
  }

  public playSecretPortalAppear() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((n, i) => {
      this.playTone(n, n * 1.04, 0.22, 'sine', 0.11, i * 0.05);
    });
    this.playShimmerNote(1046.5, 0.3, 0.05, 0.12);
  }

  public playSecretZoneComplete() {
    const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
    notes.forEach((n, i) => {
      this.playTone(n, n, 0.25, 'triangle', 0.12, i * 0.06);
    });
    this.playShimmerNote(880, 0.35, 0.06, 0.15);
  }

  public playShieldPickup() {
    this.playTone(440, 659.25, 0.22, 'sine', 0.13);
    this.playTone(659.25, 880, 0.24, 'triangle', 0.11, 0.06);
    this.playShimmerNote(880, 0.28, 0.065, 0.08);
  }

  public playShieldBreak() {
    this.playTone(587.33, 293.66, 0.22, 'triangle', 0.14);
  }

  public playPowerStarRush() {
    this.playNoiseSweep(600, 3400, 0.28, 0.075, 0);
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((n, i) => {
      this.playTone(n, n * 1.06, 0.22, 'triangle', 0.11, i * 0.045);
    });
    this.playShimmerNote(783.99, 0.34, 0.07, 0.1);
  }

  public playBossAppear() {
    this.playTone(220, 185, 0.3, 'triangle', 0.14, 0, false);
    this.playTone(261.63, 220, 0.32, 'sine', 0.12, 0.14, false);
  }

  public playBossHit() {
    this.playTone(392, 783.99, 0.18, 'triangle', 0.16);
    this.playTone(880, 1174.66, 0.2, 'sine', 0.12, 0.04);
    this.playShimmerNote(880, 0.2, 0.05, 0.03);
  }

  public playBossDefeat() {
    const victory = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    victory.forEach((n, i) => {
      this.playTone(n, n, 0.26, 'triangle', 0.13, i * 0.07);
    });
    this.playShimmerNote(1046.5, 0.42, 0.07, 0.22);
  }

  public playDash() {
    // Wind whoosh sweep + ascending crystalline light stream
    this.playNoiseSweep(500, 2900, 0.25, 0.085, 0);
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((n, i) => {
      this.playTone(n, n * 1.15, 0.16, 'triangle', 0.09, i * 0.025);
    });
    this.playShimmerNote(880, 0.22, 0.06, 0.05);
  }

  public playCloudSmash() {
    this.playTone(320, 140, 0.14, 'triangle', 0.15);
    this.playTone(783.99, 1046.5, 0.18, 'sine', 0.13, 0.03);
    this.playShimmerNote(783.99, 0.16, 0.05, 0.02);
  }

  public playHurt() {
    this.playTone(230, 105, 0.26, 'sawtooth', 0.11, 0, false);
    this.playTone(170, 85, 0.24, 'triangle', 0.12, 0.03, false);
  }

  public playStageUp() {
    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((n, i) => {
      this.playTone(n, n, 0.26, 'triangle', 0.12, i * 0.08, false);
    });
  }

  public playGameOver() {
    this.setSpeedActive(false);
    const notes = [659.25, 587.33, 523.25, 392.0];
    notes.forEach((n, i) => {
      this.playTone(n, n * 0.98, 0.3, 'sine', 0.12, i * 0.12, false);
    });
  }

  public playClick() {
    this.playTone(660, 740, 0.08, 'sine', 0.09, 0, false);
  }
}

export const audioEngine = new UnicornAudioEngine();
