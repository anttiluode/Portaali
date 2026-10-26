# Portaali

**Antti's Brain — Portals.** The AnttisBrain2 raymarcher, where each chamber
holds a portal moon into another brain. Fly into it and you're in that brain.
Turn around, and the sphere you arrived in shows home.

Each world deeper sees your camera further in the past. Home is live, one
world in sees you 4 s ago, two worlds in 8 s ago. Wave at a portal and watch
the wave arrive in the next world four seconds later.

Run: open `index.html` through GitHub Pages or any local server (the webcam
needs https or localhost). Music: `game1.mp3` … `game10.mp3` next to the file,
as in AnttisBrain2.

| key | does |
|---|---|
| W A S D | move |
| Q E | down / up |
| drag | look (inverted, as in Descent) |
| shift | boost |

Buttons: **Home** (the whole way back in one step), **New multiverse**,
camera / test pattern, idle spin.

## How it works

**A world is a seed.** As in Descent, every chamber is a pure function of
(seed, index), and nothing is stored. The portal in chamber *i* of world *s*
leads to world `childSeed(s, i)` and arrives in its chamber 0, the arrival
hall. The way back is a stack of (seed, chamber). The whole multiverse is one
number.

**A portal is a pair of spheres** of equal radius in two worlds. A ray that
enters sphere A is moved to the same point on sphere B and keeps marching in
B's world. B is ignored until the ray has passed out of it, which is the only
rule needed. That makes portals two-way, and portals can see portals (up to 6
crossings per ray). The camera crosses by the same rule as the rays, so what
you see is where you go.

**Three worlds live in the shader at once:**

| slot | world |
|---|---|
| 0 | the one you stand in |
| 1 | the one behind this chamber's portal |
| 2 | the one you came from |

Each slot has its own coordinate frame. A ray only marches its own slot's
SDF, so the cost doesn't grow with the number of worlds.

**Each world's look comes from its seed:**

- **your camera**: the walls are your webcam, recoloured in the world's palette.
- **dream stone**: the walls aren't you. The moons are the only suns, and they
  carry you as you were.
- **mirror hall**: every wall reflects, and the moons carry you as you were.

Every world also gets its own fog colour and density, and a ray takes on each
world's air in the stretch it travels there.

**The past:** a ring of 64 camera frames, one every 0.2 s (about 12.8 s), is
stored in a texture array. A world *d* portals from home samples the frame
*d* × 4 s back (capped at about 12.6 s, the oldest frame kept).

## Tests

```bash
cd tests
node test_portals.js .   # shader compiles; cross into a child, back home, then two deep
node delay_test.js       # camera turns red -> blue; the portal world stays red for 4 s
node gallery.js          # renders one child world of each look into tests/shots/
```

These run in headless Chromium (SwiftShader), with the test pattern or
`tests/testcam.png` standing in for the webcam.

## Ledger

| claim | status |
|---|---|
| Camera crosses door → child, child → home, and two deep; standing in the arrival sphere does not bounce you back | Tested (`test_portals.js`) |
| The world behind a portal sees the camera 4 s late | Tested: still red 2 s after the switch to blue, blue at 5 s (`delay_test.js`) |
| All three looks render, with no shader or page errors | Tested in SwiftShader |
| Frame rate on a real GPU | Not measured. The march is about the cost of AnttisBrain2 plus 4 portal spheres per step |
| The key-hunt game from Descent | Not ported yet |

Built from [AnttisBrain2](https://github.com/anttiluode/AnttisBrain2).
Prompted by the portal scenes on 3DPEER: those portals join stored splat
scenes, while these join hashed worlds and time.
