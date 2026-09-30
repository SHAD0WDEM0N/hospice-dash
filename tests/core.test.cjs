const {test} = require('node:test');
const assert = require('node:assert/strict');
const {Run, Clock, SETTINGS, TYPES} = require('../src/core.js');
const {createScores} = require('../src/scores.js');
function random(seed = 123) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
function memory(initial = {}) { const data = new Map(Object.entries(initial)); return {getItem:k=>data.get(k) ?? null,setItem:(k,v)=>data.set(k,v)}; }
function pilot(run) {
  if (run.mode === 'garden') {
    const next = run.obstacles.find(ob => ob.x > 130);
    if (next && !next.type.overhead && run.y >= 295 && (next.x - 160) / run.speed < 0.39) run.input();
  } else {
    const next = run.obstacles.find(ob => ob.x > 105);
    const target = next ? next.gapY - 5 : 200;
    if (run.y + run.vy * 0.18 > target && run.vy > -90) run.input();
  }
}
test('preserves old best, records previous run, never lowers best', () => {
  const store = memory({'hospice-dash-best':'9500'}), scores = createScores(store);
  assert.equal(scores.best,9500); assert.equal(scores.previous,null);
  scores.finish(800); assert.equal(scores.best,9500); assert.equal(scores.previous,800);
  scores.finish(10001.8); assert.equal(scores.best,10001); assert.equal(scores.previous,10001);
  const reloaded=createScores(store); assert.equal(reloaded.best,10001); assert.equal(reloaded.previous,10001);
});
test('blocked and corrupted browser storage does not break a run', () => {
  const blocked=createScores({getItem(){throw Error();},setItem(){throw Error();}});
  blocked.finish(42); assert.equal(blocked.best,42); assert.equal(blocked.available,false);
  assert.equal(createScores(memory({'hospice-dash-best':'Infinity'})).best,0);
});
test('ground obstacle kills, overhead passes on foot but collides during jump', () => {
  for (const type of TYPES) {
    const run=new Run(); run.obstacles=[{id:1,type,x:160}]; run.step();
    assert.equal(run.alive,Boolean(type.overhead),type.texture);
    if(type.overhead) {run.y=230;run.step();assert.equal(run.alive,false);}
  }
});
test('wings are collected, enter flight, and reset safely back to the garden', () => {
  const run=new Run();run.pickup={x:160,y:277};run.step();
  assert.equal(run.mode,'flight');assert.equal(run.obstacles.length,0);
  run.flightTime=SETTINGS.flightDuration-0.004;run.y=200;run.vy=0;run.step();
  assert.equal(run.mode,'garden');assert.equal(run.y,295);assert.ok(run.spawnIn>1);
});
test('faster taps climb, leaving a gap descends, ceiling and branches collide', () => {
  const run=new Run();run.enterFlight();run.vy=100;run.input();assert.equal(run.vy,-90);
  run.input();assert.equal(run.vy,-280);run.input();assert.equal(run.vy,-300);
  run.y=150;run.vy=0;for(let i=0;i<30;i++)run.step();assert.ok(run.y>150);
  run.flightTime=3;run.y=10;run.step();assert.equal(run.alive,false);
  const branch=new Run();branch.enterFlight();branch.flightTime=3;branch.y=80;
  branch.obstacles=[{id:1,x:160,gapY:200,gap:178,width:88}];branch.step();assert.equal(branch.alive,false);
});
test('early ground jump is buffered on landing, no double jump', () => {
  const run=new Run();run.y=294;run.vy=50;run.input();run.step();run.step();run.step();assert.ok(run.vy<0);
  const vy=run.vy;run.input();run.step();assert.ok(run.vy>vy);
});
test('30, 60 and 120 FPS advance identical simulated time; large stalls are bounded', () => {
  const scores=[];
  for(const fps of [30,60,120]) {
    const run=new Run();run.spawnIn=1e6;run.wingsIn=1e6;const clock=new Clock();
    for(let i=0;i<fps*10;i++)clock.advance(run,1000/fps);
    scores.push(run.score);
  }
  assert.ok(Math.max(...scores)-Math.min(...scores)<0.2);
  const clock=new Clock(),run=new Run();assert.ok(clock.advance(run,5000)<=12);assert.ok(run.elapsed<=0.101);
});
test('autopilot completes flight practice and all gates', () => {
  const run=new Run(640,random());run.enterFlight();
  while(run.mode==='flight' && run.alive) {pilot(run);run.step();}
  assert.equal(run.alive,true,run.deathReason);assert.equal(run.mode,'garden');
});
test('20-minute simulation past 9000 keeps obstacles bounded through repeated transitions', () => {
  const run=new Run(960,random(951));let maxObstacles=0;
  // Play continuously with the same movement and collision rules as a human.

  for(let i=0;i<120*60*20;i++) {pilot(run);run.step();maxObstacles=Math.max(maxObstacles,run.obstacles.length);assert.ok(run.alive,run.deathReason);}
  assert.ok(run.score>9000);assert.ok(run.flightVisits>5);assert.ok(maxObstacles<=8);
  assert.ok(Number.isFinite(run.y));
  console.log({soakScore:Math.floor(run.score),flightVisits:run.flightVisits,maxObstacles});
});

