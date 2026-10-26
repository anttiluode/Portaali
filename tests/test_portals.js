// Headless check: shader compiles, portal shows another world, camera crosses both ways.
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || '.';

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 480, height: 290 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction(() => window.brainReady || document.getElementById('boot').classList.contains('err'), null, { timeout: 180000 });
  const bootErr = await page.evaluate(() => document.getElementById('boot').classList.contains('err') ? document.getElementById('boot').innerText : null);
  if (bootErr) { console.log('BOOT ERROR', bootErr); process.exit(1); }
  await page.evaluate(() => { document.getElementById('boot').classList.add('gone'); brain.setIdle(0); brain.pause(true); });
  const fs=require('fs');
  const shot = async (name) => { const u = await page.evaluate(() => brain.png()); fs.writeFileSync(path.join(OUT, name), Buffer.from(u.split(',')[1], 'base64')); };
  const frame = () => page.evaluate(() => brain.frame(0.016));

  let st = await page.evaluate(() => brain.state);
  console.log('start', JSON.stringify({ seed: st.SEED, CI: st.CI, door: st.door, world: st.world.name }));

  // 1. home: stand at the hall centre, look at the portal
  await page.evaluate(() => { brain.place([0, 0.3, 0]); brain.frame(0.016); brain.lookAt(brain.state.door); });
  await frame(); await shot('1_home_looking_into_portal.png');

  // 2. walk into the door
  await page.evaluate(() => { const d = brain.state.door; brain.place([d[0] + 0.3, d[1] + 0.2, d[2]]); });
  await frame();
  st = await page.evaluate(() => brain.state);
  console.log('after door', JSON.stringify({ depth: st.depth, CI: st.CI, camSkip: st.camSkip, world: st.world.name, style: st.world.style, camP: st.camP }));
  if (st.depth !== 1 || st.camSkip !== 1) throw new Error('door crossing failed');
  await frame(); await shot('2_just_arrived_inside_return_sphere.png');

  // 3. step out of the return sphere and turn around to look back home
  const back = await page.evaluate(() => {
    for (const r of [6, 5.5, 5, 4.5]) for (let a = 0; a < 12; a++) {
      const p = [r * Math.cos(a * 0.5236), 0.3, r * Math.sin(a * 0.5236)];
      if (brain.inside(p) > 0.5) { brain.place(p); return p; }
    }
    return null;
  });
  console.log('viewpoint in child', JSON.stringify(back));
  await frame();
  st = await page.evaluate(() => brain.state);
  console.log('camSkip after stepping out', st.camSkip, 'ret', JSON.stringify(st.ret));
  await page.evaluate(() => brain.lookAt(brain.state.ret)); await frame(); await shot('3_child_world_looking_back_home.png');
  await page.evaluate(() => brain.lookAt(brain.state.door)); await frame(); await shot('4_child_world_looking_at_next_portal.png');

  // 4. walk back through the return sphere
  await page.evaluate(() => { const r = brain.state.ret; brain.place([r[0] - 0.4, r[1], r[2] + 0.2]); });
  await frame();
  st = await page.evaluate(() => brain.state);
  console.log('after return', JSON.stringify({ depth: st.depth, CI: st.CI, camSkip: st.camSkip, world: st.world.name }));
  if (st.depth !== 0 || st.camSkip !== 0) throw new Error('return crossing failed');

  // 5. two deep: step out of the door we came back through, then cross twice
  await page.evaluate(() => { brain.place([0, 0.3, 0]); }); await frame();
  await page.evaluate(() => { const d = brain.state.door; brain.place([d[0], d[1], d[2] + 0.2]); }); await frame();
  await page.evaluate(() => { brain.place([0, 0.3, 0]); }); await frame();       // inside the return sphere: must NOT cross back
  st = await page.evaluate(() => brain.state);
  if (st.depth !== 1) throw new Error('standing in the arrival sphere crossed back');
  await page.evaluate(() => { const d = brain.state.door; brain.place([d[0], d[1], d[2] - 0.2]); }); await frame();
  st = await page.evaluate(() => brain.state);
  console.log('two deep', JSON.stringify({ depth: st.depth, world: st.world.name, style: st.world.style }));
  if (st.depth !== 2) throw new Error('second crossing failed');
  await page.evaluate(() => { const r = brain.state.ret; brain.place([r[0], r[1], r[2]]); }); await frame();
  st = await page.evaluate(() => brain.state);
  if (st.depth !== 2) throw new Error('arrival sphere (still skipped) crossed back');
  console.log('ALL CROSSINGS OK');
  console.log('errors', JSON.stringify(errs));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
