/* Phaser draws the world; core.js owns fixed-step movement and collisions. */
const ids = ['score','previous','best','overlay','overlay-label','overlay-title','overlay-copy','play','status','game','mode-name','mode-note','pause','practice','storage-note'];
const ui = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
let browserStorage;
try { browserStorage = localStorage; } catch { browserStorage = { getItem() { throw Error('Storage unavailable'); } }; }
const scores = HospiceScores.createScores(browserStorage);
ui.best.textContent = scores.best.toLocaleString();
ui.previous.textContent = scores.previous === null ? '—' : scores.previous.toLocaleString();
window.hospicePersonalBest = () => scores.best;
function storageNotice() { ui['storage-note'].hidden = scores.available; }
storageNotice();

if (!window.Phaser) {
  ui['overlay-title'].textContent = 'We couldn’t load the game.';
  ui['overlay-copy'].textContent = 'Check your internet connection, then reload this page.';
  ui.play.textContent = 'Reload'; ui.play.onclick = () => location.reload();
  ui.practice.disabled = true; ui.pause.disabled = true;
} else {
  const { Run, Clock, SETTINGS } = HospiceCore;
  const worldWidth = window.innerWidth < 600 ? 640 : 960;
  document.querySelector('.stage').style.aspectRatio = `${worldWidth} / 400`;
  let run = null, playing = false, paused = false, practice = false, game;
  let hudTime = 0, saveTime = 0, lastScore = -1;
  const clock = new Clock();
  const setText = (el, value) => { value = String(value); if (el.textContent !== value) el.textContent = value; };
  function updateHud(force = false) {
    if (!run) return;
    const value = Math.floor(run.score);
    if (force || value !== lastScore) {
      setText(ui.score, value.toLocaleString()); lastScore = value;
      setText(ui.best, (practice ? scores.best : Math.max(scores.best, value)).toLocaleString());
    }
    setText(ui['mode-name'], run.mode === 'flight' ? 'SCRAPED TREES' : 'THE GARDEN RUN');
    setText(ui['mode-note'], run.mode === 'flight'
      ? `${practice ? 'Practice · ' : ''}Tap faster to climb, slower to descend · ${Math.max(0, Math.ceil(SETTINGS.flightDuration - run.flightTime))}s of wings`
      : 'Jump ground obstacles. Run under hanging ones. Collect golden wings to fly!');
  }
  function start(asPractice = false) {
    practice = asPractice; run = new Run(worldWidth); if (practice) run.enterFlight();
    playing = true; paused = false; clock.accumulator = 0; hudTime = 0; saveTime = 0; lastScore = -1;
    ui.overlay.hidden = true; ui.pause.disabled = false; ui.pause.textContent = 'Pause';
    ui.practice.disabled = true; ui.game.focus();
    game.scene.stop('garden'); game.scene.stop('flight'); game.scene.start(run.mode);
    updateHud(true); ui.status.textContent = practice ? 'Flying practice. Tap to flap. Practice scores are not saved.' : 'Running. Collect wings for Scraped Trees.';
  }
  function pause() {
    if (!playing || paused) return;
    paused = true; clock.accumulator = 0; ui.pause.textContent = 'Resume';
    ui['overlay-label'].textContent = 'TAKE A BREATHER'; ui['overlay-title'].textContent = 'Run paused';
    ui['overlay-copy'].textContent = 'Your run is waiting. Resume when you are ready.';
    ui.play.textContent = 'Resume'; ui.overlay.hidden = false;
    if (!practice) scores.recordBest(run.score);
    storageNotice();
  }
  function resume() { paused = false; clock.accumulator = 0; ui.pause.textContent = 'Pause'; ui.overlay.hidden = true; ui.game.focus(); }
  function finish(completed = false) {
    playing = false; ui.pause.disabled = true; ui.practice.disabled = false;
    if (!practice) { scores.finish(run.score); setText(ui.previous, scores.previous.toLocaleString()); }
    updateHud(true); storageNotice();
    ui['overlay-label'].textContent = practice ? 'FLYING PRACTICE' : 'EVERY LITTLE RUN COUNTS';
    ui['overlay-title'].textContent = completed ? 'Forest cleared!' : 'A lovely little run.';
    ui['overlay-copy'].textContent = practice
      ? `${completed ? 'Nice flying!' : run.deathReason} Practice scores are not saved.`
      : `${Math.floor(run.score).toLocaleString()} metres · ${run.deathReason}`;
    ui.play.textContent = 'Run again'; ui.overlay.hidden = false;
    ui.status.textContent = `${ui['overlay-title'].textContent} ${ui['overlay-copy'].textContent}`;
    window.dispatchEvent(new Event('hospice-score-updated'));
  }
  function act() {
    if (paused) { resume(); return; }
    if (!playing) { start(); return; }
    run.input();
  }
  class ParkScene extends Phaser.Scene {
    constructor(key) { super(key); }
    create() {
      createGameArtwork(this); this.objects = new Map(); this.lastPose = '';
      const flying = this.scene.key === 'flight';
      this.add.rectangle(worldWidth / 2, 200, worldWidth, 400, flying ? 0xd9e6ce : 0xe6efd9);
      this.add.circle(worldWidth - 100, 73, 33, 0xf4d58a);
      const scenery = this.add.graphics();
      scenery.fillStyle(0xccdfb4).fillEllipse(140, 310, 630, 230).fillEllipse(780, 310, 770, 300);
      scenery.fillStyle(0xb1cc9d).fillEllipse(520, 345, 820, 190);
      for (const x of [60, 270, 460, 700, 870]) {
        scenery.fillStyle(flying ? 0x93ad83 : 0x8ea782).fillRect(x, flying ? 0 : 210, flying ? 24 : 9, 400);
        scenery.fillStyle(0xa3bf8c).fillCircle(x + 4, flying ? 60 : 200, 35);
      }
      this.marks = [];
      if (!flying) {
        scenery.fillStyle(0x90b182).fillRect(0, 322, worldWidth, 9);
        scenery.fillStyle(0xecdcb8).fillRect(0, 331, worldWidth, 69);
        for (let i = 0; i < 18; i++) this.marks.push(this.add.rectangle(i * 60, 353 + (i % 3) * 14, 20, 3, 0xd5c59e));
      }
      this.wings = this.add.image(160, 200, 'wings').setDepth(2).setScale(0.9).setVisible(flying);
      this.player = this.add.image(160, run ? run.y : 295, 'runner').setDepth(3);
      this.pickup = this.add.image(0, 0, 'wings').setVisible(false).setDepth(4);
      this.pickupLabel = this.add.text(0, 0, 'WINGS', {fontFamily:'sans-serif',fontSize:'13px',fontStyle:'bold',color:'#6c5521',backgroundColor:'#fff4cb',padding:{x:7,y:3}}).setOrigin(0.5).setDepth(4).setVisible(false);
      const pointer = () => act();
      const key = event => {
        if (['INPUT','TEXTAREA','BUTTON','SELECT'].includes(event.target.tagName) || event.target.isContentEditable) return;
        if (event.code === 'Space' && !event.repeat) { event.preventDefault(); act(); }
        if (event.code === 'Escape' && !event.repeat && playing) paused ? resume() : pause();
      };
      this.input.on('pointerdown', pointer); this.input.keyboard.on('keydown', key);
      this.events.once('shutdown', () => { this.input.off('pointerdown', pointer); this.input.keyboard.off('keydown', key); });
    }
    drawGate(ob) {
      const g = this.add.graphics().setDepth(1), top = ob.gapY - ob.gap / 2, bottom = ob.gapY + ob.gap / 2;
      g.fillStyle(0x75543a).fillRect(-30, 0, 40, top).fillRect(-7, bottom, 39, 400-bottom);
      g.fillStyle(0x8f6845).fillRoundedRect(-44, top-24, 88, 24, 7).fillRoundedRect(-44, bottom, 88, 24, 7);
      g.fillStyle(0x41693f).fillRoundedRect(-44, top-49, 88, 25, 10).fillRoundedRect(-44, bottom+24, 88, 27, 10);
      g.fillStyle(0xb4c886).fillRect(-36, top-6, 72, 4).fillRect(-36, bottom+2, 72, 4);
      return g;
    }
    renderRun() {
      if (!run) return;
      this.player.y = run.y; this.wings.y = run.y;
      const grounded = run.mode === 'garden' && run.y >= 295;
      const pose = playing && grounded ? `run-${Math.floor(run.scroll / 32) % 4}` : 'runner';
      if (pose !== this.lastPose) { this.player.setTexture(pose); this.lastPose = pose; }
      if (!run.alive) this.player.setTint(0xe2a280);
      for (let i = 0; i < this.marks.length; i++) this.marks[i].x = ((i * 60 - run.scroll) % 1080 + 1080) % 1080 - 25;
      for (const ob of run.obstacles) {
        let graphic = this.objects.get(ob.id);
        if (!graphic) {
          graphic = run.mode === 'flight' ? this.drawGate(ob) : this.add.image(ob.x, (ob.type.overhead ? 245 : 331) - ob.type.height / 2, ob.type.texture);
          this.objects.set(ob.id, graphic);
        }
        graphic.x = ob.x;
      }
      for (const [id, graphic] of this.objects) {
        if (!run.obstacles.some(ob => ob.id === id)) { graphic.destroy(); this.objects.delete(id); }
      }
      this.pickup.setVisible(Boolean(run.pickup)); this.pickupLabel.setVisible(Boolean(run.pickup));
      if (run.pickup) { this.pickup.setPosition(run.pickup.x, run.pickup.y); this.pickupLabel.setPosition(run.pickup.x, run.pickup.y - 43); }
    }
    update(time, delta) {
      if (!playing || paused || document.hidden) return;
      clock.advance(run, delta);
      if (run.mode !== this.scene.key) {
        if (practice && run.mode === 'garden') { finish(true); return; }
        updateHud(true); this.scene.start(run.mode); clock.accumulator = 0;
        ui.status.textContent = run.mode === 'flight' ? 'Wings collected! Scraped Trees. Tap faster to climb and slower to descend.' : 'Back in the garden. Jump over ground obstacles.';
        return;
      }
      this.renderRun();
      hudTime += delta; saveTime += delta;
      if (hudTime >= 100) { updateHud(); hudTime = 0; }
      if (saveTime >= 5000) { if (!practice) scores.recordBest(run.score); saveTime = 0; storageNotice(); }
      if (!run.alive) finish();
    }
  }
  class GardenRun extends ParkScene { constructor() { super('garden'); } }
  class ScrapedTrees extends ParkScene { constructor() { super('flight'); } }
  game = new Phaser.Game({type:Phaser.AUTO,parent:'game',width:worldWidth,height:400,backgroundColor:'#e6efd9',
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[GardenRun,ScrapedTrees]});
  ui.play.onclick = () => paused ? resume() : start();
  ui.practice.onclick = () => start(true);
  ui.pause.onclick = () => paused ? resume() : pause();
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);
  window.addEventListener('pagehide', () => { if (run && !practice) scores.recordBest(run.score); });
  ui.status.textContent = 'Ready. Start a run or try flying practice.';
}
