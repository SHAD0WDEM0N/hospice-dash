/* The simulation uses seconds and pixels, independent of rendering frame rate. */
(function (root) {
  'use strict';
  const SETTINGS = { speed: 320, maxSpeed: 540, acceleration: 6, gravity: 1700, jump: -650,
    step: 1 / 120, flightDuration: 24, flightGravity: 650, flap: 190 };
  const TYPES = [
    { texture: 'planter', width: 46, height: 52, bodyWidth: 40, bodyHeight: 45 },
    { texture: 'hedge', width: 82, height: 48, bodyWidth: 76, bodyHeight: 43 },
    { texture: 'hurdle', width: 50, height: 70, bodyWidth: 44, bodyHeight: 65 },
    { texture: 'branch', width: 120, height: 245, bodyWidth: 112, bodyHeight: 85, overhead: true },
    { texture: 'lamp', width: 64, height: 245, bodyWidth: 56, bodyHeight: 76, overhead: true }
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  class Run {
    constructor(width = 960, random = Math.random) { this.width = width; this.random = random; this.reset(); }
    between(a, b) { return a + this.random() * (b - a); }
    reset() {
      this.mode = 'garden'; this.alive = true; this.score = 0; this.speed = SETTINGS.speed;
      this.elapsed = 0; this.scroll = 0; this.y = 295; this.vy = 0; this.buffer = 0;
      this.obstacles = []; this.pickup = null; this.spawnIn = 0.8; this.spawned = 0; this.serial = 0;
      this.wingsIn = this.between(14, 24); this.flightTime = 0; this.gateIn = 2;
      this.gapY = 200; this.deathReason = ''; this.flightVisits = 0;
    }
    input() {
      if (!this.alive) return;
      if (this.mode === 'flight') this.vy = Math.max(-300, this.vy - SETTINGS.flap);
      else this.buffer = 0.12; // A slightly early tap is applied on landing.
    }
    playerBox() { return { x: 145, y: this.y - 29, w: 28, h: 65 }; }
    enterFlight() {
      this.mode = 'flight'; this.flightVisits++; this.obstacles.length = 0; this.pickup = null;
      this.y = 200; this.vy = -80; this.buffer = 0; this.flightTime = 0; this.gateIn = 2;
      this.gapY = 200;
    }
    leaveFlight() {
      this.mode = 'garden'; this.obstacles.length = 0; this.y = 295; this.vy = 0;
      this.buffer = 0; this.spawnIn = 1.4; this.wingsIn = this.between(24, 40);
    }
    die(reason) { this.alive = false; this.deathReason = reason; }
    step(dt = SETTINGS.step) {
      if (!this.alive) return;
      this.elapsed += dt;
      this.speed = Math.min(SETTINGS.maxSpeed, this.speed + dt * SETTINGS.acceleration);
      const travelSpeed = this.mode === 'garden' ? this.speed : 220;
      this.scroll += travelSpeed * dt; this.score += travelSpeed * dt / 25;
      if (this.mode === 'flight') this.stepFlight(dt); else this.stepGarden(dt);
    }
    stepGarden(dt) {
      if (this.buffer > 0 && this.y >= 295 && this.vy >= 0) { this.vy = SETTINGS.jump; this.buffer = 0; }
      this.buffer = Math.max(0, this.buffer - dt);
      this.vy += SETTINGS.gravity * dt; this.y += this.vy * dt;
      if (this.y > 295) { this.y = 295; this.vy = 0; }
      this.wingsIn -= dt; this.spawnIn -= dt;
      if (this.spawnIn <= 0 && !this.pickup) {
        if (this.wingsIn <= 0) {
          this.pickup = { x: this.width + 50, y: 277 };
          this.spawnIn = 1.5;
        } else {
          const intro = [0, 3, 1, 4];
          const type = TYPES[intro[this.spawned] ?? Math.floor(this.random() * TYPES.length)];
          this.obstacles.push({ id: ++this.serial, type, x: this.width + type.width / 2 });
          this.spawned++;
          const d = (this.speed - SETTINGS.speed) / (SETTINGS.maxSpeed - SETTINGS.speed);
          this.spawnIn = this.between(1.15 - d * 0.2, 1.5 - d * 0.3) + (type.overhead ? 0.12 : 0);
        }
      }
      const player = this.playerBox();
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const ob = this.obstacles[i], type = ob.type;
        ob.x -= this.speed * dt;
        if (ob.x < -type.width) { this.obstacles.splice(i, 1); continue; }
        if (overlaps(player, { x: ob.x - type.bodyWidth / 2, y: (type.overhead ? 245 : 331) - type.bodyHeight, w: type.bodyWidth, h: type.bodyHeight })) {
          this.die(type.overhead ? 'Stay on the ground beneath branches and lamps.' : 'Jump over planters, hedges and hurdles.'); return;
        }
      }
      if (this.pickup) {
        this.pickup.x -= this.speed * dt;
        if (overlaps(player, { x: this.pickup.x - 28, y: this.pickup.y - 22, w: 56, h: 44 })) this.enterFlight();
        else if (this.pickup.x < -60) { this.pickup = null; this.wingsIn = this.between(12, 20); this.spawnIn = 0.5; }
      }
    }
    stepFlight(dt) {
      this.flightTime += dt;
      this.vy = Math.min(340, this.vy + SETTINGS.flightGravity * dt);
      this.y += this.vy * dt;
      // Gentle ceiling/floor during the two-second introduction, then real boundaries.
      if (this.flightTime < 2) {
        this.y = clamp(this.y, 42, 356); if (this.y === 356 || this.y === 42) this.vy = 0;
      } else if (this.y < 36 || this.y > 364) { this.die('Tap to flap. Tap faster to climb; leave a longer gap to descend.'); return; }
      this.gateIn -= dt;
      if (this.gateIn <= 0 && this.flightTime < SETTINGS.flightDuration - 4) {
        this.gapY = clamp(this.gapY + this.between(-48, 48), 130, 265);
        this.obstacles.push({ id: ++this.serial, x: this.width + 55, gapY: this.gapY, gap: 178, width: 88 });
        this.gateIn = this.between(1.65, 1.95);
      }
      const player = this.playerBox();
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const gate = this.obstacles[i]; gate.x -= 220 * dt;
        if (gate.x < -100) { this.obstacles.splice(i, 1); continue; }
        const top = gate.gapY - gate.gap / 2, bottom = gate.gapY + gate.gap / 2;
        if (overlaps(player, {x:gate.x - 44,y:0,w:88,h:top}) || overlaps(player, {x:gate.x - 44,y:bottom,w:88,h:400-bottom})) {
          this.die('Find the opening between the tree branches. Short, steady taps help.'); return;
        }
      }
      if (this.flightTime >= SETTINGS.flightDuration) this.leaveFlight();
    }
  }
  class Clock {
    constructor() { this.accumulator = 0; }
    advance(run, deltaMs) {
      // Do not fast-forward through a frozen/background tab.
      this.accumulator += Math.min(Math.max(0, deltaMs), 100) / 1000;
      let steps = 0;
      while (this.accumulator >= SETTINGS.step && steps < 12) {
        run.step(); this.accumulator -= SETTINGS.step; steps++;
      }
      return steps;
    }
  }
  const api = { SETTINGS, TYPES, Run, Clock, overlaps };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HospiceCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
