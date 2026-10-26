// Find seeds whose first portal leads to each look; render home->portal and inside views.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 380 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction(() => window.brainReady, null, { timeout: 180000 });
  // optional stand-in for the webcam: any photo saved as tests/testcam.png
  const cam = path.join(__dirname, 'testcam.png');
  const b64 = fs.existsSync(cam) ? fs.readFileSync(cam).toString('base64') : null;
  await page.evaluate(async (b64) => { document.getElementById('boot').classList.add('gone'); brain.setIdle(0); brain.pause(true);
    if (b64) { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); window.__fakeCam = im; } }, b64);
  const shot = async n => { const u = await page.evaluate(() => { brain.frame(0.016); return brain.png(); }); fs.mkdirSync(path.join(__dirname,'shots'),{recursive:true}); fs.writeFileSync(path.join(__dirname,'shots', n), Buffer.from(u.split(',')[1], 'base64')); };
  const found = {};
  for (let s = 1; s < 400 && Object.keys(found).length < 3; s++) {
    const st = await page.evaluate(s => { brain.setRoot(s * 2654435761); return brain.childLook().style; }, s);
    if (found[st] === undefined) found[st] = s;
  }
  console.log('seeds per child look', JSON.stringify(found));
  for (const [style, s] of Object.entries(found)) {
    await page.evaluate(s => { brain.setRoot(s * 2654435761); brain.place([0, 0.3, 0]); brain.frame(0.016); }, s);
    // stand ~3.5 m in front of the portal, on the hall-centre side
    await page.evaluate(() => { const d = brain.state.door; const L = Math.hypot(d[0], d[2]); const k = Math.max(0, (L - 4.2) / L); brain.place([d[0] * k, 0.3, d[2] * k]); brain.lookAt(brain.state.door); });
    await shot(`g${style}_a_home_into_portal.png`);
    await page.evaluate(() => { const d = brain.state.door; brain.place([d[0], d[1] + 0.1, d[2]]); brain.frame(0.016); });
    await page.evaluate(() => { for (const r of [6.5, 6, 5.5]) for (let a = 0; a < 12; a++) { const p = [r * Math.cos(a * 0.5236), 0.6, r * Math.sin(a * 0.5236)]; if (brain.inside(p) > 0.8) { brain.place(p); return; } } });
    await page.evaluate(() => { brain.frame(0.016); brain.lookAt(brain.state.ret); });
    await shot(`g${style}_b_inside_looking_back_home.png`);
    await page.evaluate(() => { const r = brain.state.ret, c = brain.state.camP; brain.lookAt([2 * c[0] - r[0], c[1], 2 * c[2] - r[2]]); });
    await shot(`g${style}_c_inside_looking_away.png`);
    console.log(style, JSON.stringify(await page.evaluate(() => ({ depth: brain.state.depth, world: brain.state.world.name, fog: brain.state.world.fog.map(v => +v.toFixed(2)) }))));
  }
  console.log('errors', JSON.stringify(errs));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
