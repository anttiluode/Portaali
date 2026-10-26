const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 320, height: 200 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction(() => window.brainReady, null, { timeout: 180000 });
  const r = await page.evaluate(() => {
    document.getElementById('boot').classList.add('gone'); brain.setIdle(0); brain.pause(true);
    brain.setRoot(2 * 2654435761);                         // child look = dream stone? use the one whose child is "your camera"
    const c = document.createElement('canvas'); c.width = 64; c.height = 48; c.complete = true; window.__fakeCam = c;
    const g = c.getContext('2d');
    const paint = col => { g.fillStyle = col; g.fillRect(0, 0, 64, 48); };
    const read = () => { const gl = document.getElementById('gl').getContext('webgl2'); const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
      const px = new Uint8Array(4); gl.readPixels(W >> 1, H >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const ctr = [...px.slice(0, 3)];
      gl.readPixels(4, H >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return { portalCentre: ctr, homeEdge: [...px.slice(0, 3)] }; };
    brain.place([0, 0.3, 0]); brain.frame(0.016);
    const d = brain.state.door; const L = Math.hypot(d[0], d[2]); const k = Math.max(0, (L - 3.0) / L);
    brain.place([d[0] * k, 0.3, d[2] * k]); brain.lookAt(d);
    paint('#d02020'); for (let i = 0; i < 40; i++) brain.frame(0.2);      // 8 s of red
    const allRed = read();
    paint('#2040d0'); for (let i = 0; i < 10; i++) brain.frame(0.2);      // then 2 s of blue
    const twoSecBlue = read();
    for (let i = 0; i < 15; i++) brain.frame(0.2);                        // 5 s of blue in total
    const fiveSecBlue = read();
    return { child: brain.childLook().style, timeV: document.getElementById('timeV').textContent, allRed, twoSecBlue, fiveSecBlue };
  });
  console.log(JSON.stringify(r, null, 1)); console.log('errors', JSON.stringify(errs));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
