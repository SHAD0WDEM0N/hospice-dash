/* Change these numbers to experiment with how the game feels. */
const SETTINGS = { speed: 320, maxSpeed: 540, acceleration: 6, gravity: 1700, jump: -650 };
const OBSTACLES = [
  { texture: 'planter', width: 46, height: 52, bodyWidth: 40, bodyHeight: 45 },
  { texture: 'hedge', width: 82, height: 48, bodyWidth: 76, bodyHeight: 43 },
  { texture: 'hurdle', width: 50, height: 70, bodyWidth: 44, bodyHeight: 65 },
  // Their bottom is above a standing runner's head, but inside the jump arc.
  { texture: 'branch', width: 120, height: 245, bodyWidth: 112, bodyHeight: 85, overhead: true },
  { texture: 'lamp', width: 64, height: 245, bodyWidth: 56, bodyHeight: 76, overhead: true }
];
const ui = Object.fromEntries(['score', 'best', 'overlay', 'overlay-label', 'overlay-title', 'overlay-copy', 'play', 'status', 'game'].map(id => [id, document.getElementById(id)]));
let best = 0;
try { const saved = Number(localStorage.getItem('hospice-dash-best')); if (Number.isFinite(saved) && saved > 0) best = Math.floor(saved); } catch { /* Private browsing can disable storage. Playing still works. */ }
ui.best.textContent = best;

if (!window.Phaser) {
  ui['overlay-title'].textContent = 'We couldn’t load the game.';
  ui['overlay-copy'].textContent = 'Check your internet connection, then reload this page.';
  ui.play.textContent = 'Reload';
  ui.play.onclick = () => location.reload();
  ui.status.textContent = 'Game unavailable. Internet is needed to load Phaser.';
} else {
  const worldWidth = window.innerWidth < 600 ? 640 : 960;
  document.querySelector('.stage').style.aspectRatio = `${worldWidth} / 400`;
  class GardenRun extends Phaser.Scene {
    create() {
      this.running = false;
      this.distance = 0;
      this.speed = SETTINGS.speed;
      this.nextObstacle = 1.5;
      this.add.rectangle(480, 200, 960, 400, 0xe6efd9);
      this.add.circle(785, 73, 33, 0xf4d58a);
      this.clouds = [this.cloud(130, 75), this.cloud(490, 48), this.cloud(900, 115)];
      const scenery = this.add.graphics();
      scenery.fillStyle(0xccdfb4).fillEllipse(140, 310, 630, 230).fillEllipse(780, 310, 770, 300);
      scenery.fillStyle(0xb1cc9d).fillEllipse(520, 345, 820, 190);
      [60, 370, 850].forEach((x, i) => { scenery.fillStyle(0x8ea782).fillRect(x, 210, 9, 112); scenery.fillStyle(0xa3bf8c).fillCircle(x + 4, 200, 30 + i * 5); });
      scenery.fillStyle(0x90b182).fillRect(0, 322, 960, 9);
      scenery.fillStyle(0xecdcb8).fillRect(0, 331, 960, 69);
      this.marks = Array.from({length: 18}, (_, i) => this.add.rectangle(i * 60, 353 + (i % 3) * 14, 20, 3, 0xd5c59e));

      // Draw our own artwork, so no image downloads or asset setup are needed.
      const art = this.make.graphics({x: 0, y: 0}, false);
      // Equal-size frames animate the artwork without moving the collision box.
      const poses = [
        { key: 'runner', back: 15, front: 31, arm: 29 },
        { key: 'run-0', back: 8, front: 36, arm: 30 },
        { key: 'run-1', back: 19, front: 26, arm: 24 },
        { key: 'run-2', back: 36, front: 8, arm: 12 },
        { key: 'run-3', back: 26, front: 19, arm: 24 }
      ];
      for (const pose of poses) {
        art.lineStyle(8, 0x416457).lineBetween(27, 54, pose.back, 66);
        art.fillStyle(0xd5dfd4).fillRoundedRect(pose.back - 5, 65, 13, 6, 2);
        art.lineStyle(8, 0x24493f).lineBetween(17, 54, pose.front, 66);
        art.fillStyle(0xf8faf0).fillRoundedRect(pose.front - 5, 65, 13, 6, 2);
        art.fillStyle(0x214e43).fillRoundedRect(9, 29, 28, 30, 8);
        art.fillStyle(0xf4b48c).fillCircle(24, 17, 12);
        art.fillStyle(0x594b40).fillRoundedRect(12, 3, 24, 10, 4);
        art.lineStyle(7, 0xf4b48c).lineBetween(25, 34, pose.arm + 5, 43);
        art.fillStyle(0xf4e4b6).fillCircle(24, 42, 4);
        art.generateTexture(pose.key, 48, 72); art.clear();
      }
      art.fillStyle(0x79995b).fillCircle(12, 12, 11).fillCircle(32, 10, 10);
      art.fillStyle(0xd28662).fillRoundedRect(2, 19, 42, 33, 4);
      art.fillStyle(0xe49c75).fillRoundedRect(0, 17, 46, 8, 2);
      art.generateTexture('planter', 46, 52); art.clear();
      art.fillStyle(0x517447).fillRoundedRect(3, 12, 76, 36, 8);
      art.fillStyle(0x789858).fillCircle(19, 18, 16).fillCircle(42, 17, 17).fillCircle(64, 18, 16);
      art.fillStyle(0xa4bc72).fillCircle(17, 12, 4).fillCircle(47, 10, 4).fillCircle(65, 18, 4);
      art.generateTexture('hedge', 82, 48); art.clear();
      art.fillStyle(0x9b684b).fillRect(5, 8, 8, 62).fillRect(37, 8, 8, 62);
      art.fillStyle(0xe9a65c).fillRoundedRect(0, 0, 50, 17, 3);
      art.fillStyle(0xfff3d5).fillRect(8, 2, 8, 13).fillRect(30, 2, 8, 13);
      art.generateTexture('hurdle', 50, 70); art.clear();
      // Branch hangs into the path; there is deliberately no trunk blocking the ground.
      art.fillStyle(0x76543b).fillRect(93, 0, 14, 200).fillRoundedRect(4, 188, 110, 16, 7);
      art.fillStyle(0x365c3b).fillRoundedRect(4, 166, 112, 70, 16);
      art.fillStyle(0x527c45).fillCircle(25, 187, 20).fillCircle(61, 185, 22).fillCircle(94, 190, 20);
      art.fillStyle(0x7a9b52).fillCircle(22, 178, 7).fillCircle(64, 176, 8);
      art.fillStyle(0x365c3b).fillRoundedRect(10, 224, 14, 21, 5).fillRoundedRect(81, 220, 17, 25, 5);
      art.generateTexture('branch', 120, 245); art.clear();
      art.fillStyle(0x344d48).fillRect(29, 0, 6, 178).fillRoundedRect(4, 169, 56, 12, 4);
      art.fillStyle(0x344d48).fillRoundedRect(9, 179, 46, 59, 5);
      art.fillStyle(0xf3ce70).fillRect(15, 184, 34, 44);
      art.fillStyle(0xffebaa).fillRect(19, 188, 11, 32);
      art.fillStyle(0x344d48).fillRect(29, 180, 6, 53).fillRoundedRect(4, 234, 56, 11, 4);
      art.generateTexture('lamp', 64, 245); art.destroy();
      const floor = this.add.rectangle(480, 344, 960, 26, 0, 0);
      this.physics.add.existing(floor, true);
      this.player = this.physics.add.sprite(160, 295, 'runner').setDepth(2);
      this.player.body.setSize(28, 65).setOffset(9, 7);
      this.physics.add.collider(this.player, floor);
      this.obstacles = this.physics.add.group({allowGravity: false, immovable: true});
      this.physics.add.overlap(this.player, this.obstacles, (player, obstacle) => this.finish(obstacle));
      this.input.on('pointerdown', () => this.act());
      this.input.keyboard.on('keydown-SPACE', event => { if (!event.repeat && event.target.tagName !== 'BUTTON') { event.preventDefault(); this.act(); } });
      ui.play.onclick = () => this.startRun();
      ui.status.textContent = 'Ready. Start running with the button or Space.';
    }
    cloud(x, y) {
      const g = this.add.graphics({x, y});
      g.fillStyle(0xf8faed).fillRoundedRect(-35, 0, 95, 19, 10).fillCircle(0, 0, 22).fillCircle(27, -4, 28);
      return g;
    }
    startRun() {
      this.obstacles.clear(true, true);
      this.distance = 0; this.speed = SETTINGS.speed; this.nextObstacle = 0.8;
      this.obstaclesSpawned = 0;
      this.runStep = 0;
      this.player.setTexture('runner');
      this.player.clearTint(); this.player.setPosition(160, 295); this.player.body.reset(160, 295);
      this.physics.resume(); this.running = true;
      ui.score.textContent = '0'; ui.overlay.hidden = true; ui.game.focus();
      ui.status.textContent = 'Running. Space, click or tap to jump.';
    }
    act() {
      if (!this.running) { this.startRun(); return; }
      // Only jump from the ground: holding the button never gives extra jumps.
      if (this.player.body.blocked.down || this.player.body.touching.down) {
        this.player.setTexture('runner');
        this.player.setVelocityY(SETTINGS.jump);
      }
    }
    finish(obstacle) {
      if (!this.running) return;
      this.running = false; this.physics.pause(); this.player.setTexture('runner').setTint(0xe2a280);
      const score = Math.floor(this.distance);
      if (score > best) { best = score; try { localStorage.setItem('hospice-dash-best', String(best)); } catch {} }
      ui.best.textContent = best;
      ui['overlay-label'].textContent = 'EVERY LITTLE RUN COUNTS';
      ui['overlay-title'].textContent = 'A lovely little run.';
      const tip = obstacle?.getData('overhead') ? 'Stay on the ground beneath branches and lamps!' : 'Jump over ground obstacles; run beneath hanging ones.';
      ui['overlay-copy'].textContent = `${score} metres · Best ${best}. ${tip}`;
      ui.play.innerHTML = 'Run again <span>↻</span>'; ui.overlay.hidden = false;
      ui.status.textContent = `Game over. Score ${score}. Personal best ${best}. Choose Run again or press Space.`;
    }
    update(time, delta) {
      if (!this.running) return;
      const dt = Math.min(delta, 50) / 1000;
      this.speed = Math.min(SETTINGS.maxSpeed, this.speed + dt * SETTINGS.acceleration);
      const grounded = this.player.body.blocked.down || this.player.body.touching.down;
      if (grounded && this.player.body.velocity.y >= 0) {
        this.runStep += dt * 10 * this.speed / SETTINGS.speed;
        this.player.setTexture(`run-${Math.floor(this.runStep) % 4}`);
      } else {
        this.player.setTexture('runner');
      }
      this.distance += this.speed * dt / 25; ui.score.textContent = Math.floor(this.distance);
      this.marks.forEach(mark => { mark.x -= this.speed * dt; if (mark.x < -25) mark.x += 1080; });
      this.clouds.forEach(cloud => { cloud.x -= dt * 12; if (cloud.x < -100) cloud.x = 1060; });
      this.nextObstacle -= dt;
      if (this.nextObstacle <= 0) {
        // Teach jump / stay down immediately, then mix both kinds unpredictably.
        const introduction = [OBSTACLES[0], OBSTACLES[3], OBSTACLES[1], OBSTACLES[4]];
        const type = introduction[this.obstaclesSpawned] || Phaser.Utils.Array.GetRandom(OBSTACLES);
        const bottom = type.overhead ? 245 : 331;
        const obstacle = this.obstacles.create(worldWidth + type.width / 2, bottom - type.height / 2, type.texture);
        obstacle.setData('overhead', Boolean(type.overhead));
        obstacle.body.setSize(type.bodyWidth, type.bodyHeight).setOffset((type.width - type.bodyWidth) / 2, type.height - type.bodyHeight);
        this.obstaclesSpawned++;
        const difficulty = (this.speed - SETTINGS.speed) / (SETTINGS.maxSpeed - SETTINGS.speed);
        // A jump lasts about 0.77 seconds. Leave time to land before the next one.
        const recovery = type.overhead ? 0.12 : 0;
        this.nextObstacle = Phaser.Math.FloatBetween(1.15 - difficulty * 0.2 + recovery, 1.5 - difficulty * 0.3 + recovery);
      }
      this.obstacles.getChildren().forEach(obstacle => { obstacle.setVelocityX(-this.speed); if (obstacle.x < -50) obstacle.destroy(); });
    }
  }
  new Phaser.Game({type: Phaser.AUTO, parent: 'game', width: worldWidth, height: 400,
    backgroundColor: '#e6efd9', scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
    physics: {default: 'arcade', arcade: {gravity: {y: SETTINGS.gravity}, debug: false}}, scene: GardenRun});
}

