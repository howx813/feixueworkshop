/**
 * Text-drop physics — tiny 2D rigid-body sandbox, zero dependencies.
 * Each character is a circular body: gravity, wall/floor bounces,
 * circle-circle impulses with restitution + friction, spatial-hash
 * broad phase, and a sleep system so piles settle instead of jittering.
 *
 * Units are pixels/second; dt is seconds (fixed step from the caller).
 */

const G = 1900; // gravity px/s²
const REST = 0.32; // restitution (bounciness)
const FLOOR_FRICTION = 0.9; // horizontal velocity kept per contact frame
const AIR_DRAG = 0.999;
const SLEEP_SPEED2 = 55 * 55; // |v|² below this counts as calm
const CALM_FRAMES_NEEDED = 20;
const WAKE_IMPULSE = 480; // min |vn| that wakes a sleeper

export function createWorld(width, height) {
  return { width, height, bodies: [], gravitySign: 1, time: 0, calmTime: 0 };
}

export function resizeWorld(world, width, height) {
  world.width = width;
  world.height = height;
}

export function spawnBody(world, opts) {
  const body = {
    x: opts.x,
    y: opts.y,
    vx: opts.vx || 0,
    vy: opts.vy || 0,
    r: opts.r || 17,
    char: opts.char,
    color: opts.color,
    angle: (Math.random() - 0.5) * 0.5,
    va: (Math.random() - 0.5) * 3,
    sleeping: false,
    calmFrames: 0,
  };
  world.bodies.push(body);
  return body;
}

function wake(body, amount) {
  if (!body.sleeping) return;
  if (Math.abs(amount) > WAKE_IMPULSE / 60) {
    body.sleeping = false;
    body.calmFrames = 0;
  }
}

/** Clamp a body back inside walls after collision pushes (also kills normal velocity). */
function clampBounds(world, b) {
  const floorY = world.height - 6;
  if (b.x < b.r) {
    b.x = b.r;
    if (b.vx < 0) b.vx = -b.vx * REST;
  }
  if (b.x > world.width - b.r) {
    b.x = world.width - b.r;
    if (b.vx > 0) b.vx = -b.vx * REST;
  }
  if (world.gravitySign > 0) {
    if (b.y > floorY - b.r) {
      b.y = floorY - b.r;
      if (b.vy > 0) b.vy = Math.abs(b.vy) > 55 ? -b.vy * REST : 0;
      b.vx *= FLOOR_FRICTION;
      // dead zone: kill micro-sliding so piles can actually sleep
      if (Math.abs(b.vx) < 6) b.vx = 0;
    }
  } else if (b.y < -40 + b.r) {
    b.y = -40 + b.r;
    if (b.vy < 0) b.vy = Math.abs(b.vy) > 55 ? -b.vy * REST : 0;
    b.vx *= FLOOR_FRICTION;
    if (Math.abs(b.vx) < 6) b.vx = 0;
  }
}

/** One fixed physics step. */
export function step(world, dt) {
  const g = G * world.gravitySign;
  _gravDown = world.gravitySign > 0;
  const bodies = world.bodies;
  const floorY = world.height - 6;
  const ceilY = -40; // allow spawning slightly above

  // -- integrate --
  for (const b of bodies) {
    if (b.sleeping) continue;
    b.vy += g * dt;
    b.vx *= AIR_DRAG;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.angle += b.va * dt;
    b.va *= 0.985;
  }

  // -- walls & floor --
  for (const b of bodies) {
    if (b.sleeping) continue;
    if (b.x < b.r) {
      b.x = b.r;
      if (b.vx < 0) {
        wake(b, b.vx);
        b.vx = -b.vx * REST;
      }
    } else if (b.x > world.width - b.r) {
      b.x = world.width - b.r;
      if (b.vx > 0) {
        wake(b, b.vx);
        b.vx = -b.vx * REST;
      }
    }
    if (world.gravitySign > 0 && b.y > floorY - b.r) {
      b.y = floorY - b.r;
      if (b.vy > 0) {
        wake(b, b.vy);
        b.vy = -b.vy * REST;
        if (Math.abs(b.vy) < 55) b.vy = 0;
      }
      b.vx *= FLOOR_FRICTION;
      b.va *= 0.92;
    } else if (world.gravitySign < 0 && b.y < ceilY + b.r) {
      b.y = ceilY + b.r;
      if (b.vy < 0) {
        wake(b, b.vy);
        b.vy = -b.vy * REST;
        if (Math.abs(b.vy) < 55) b.vy = 0;
      }
      b.vx *= FLOOR_FRICTION;
    }
  }

  // -- broad phase: spatial hash --
  const cell = 44;
  const grid = new Map();
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    const k = ((b.x / cell) | 0) * 4096 + ((b.y / cell) | 0);
    let arr = grid.get(k);
    if (!arr) grid.set(k, (arr = []));
    arr.push(i);
  }

  // -- narrow phase + bounds clamp, iterated (pair pushes can squeeze bodies
  //    through walls or into each other; re-running settles both) --
  for (let iter = 0; iter < 3; iter++) {
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      const cx = (a.x / cell) | 0;
      const cy = (a.y / cell) | 0;
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const arr = grid.get(gx * 4096 + gy);
          if (!arr) continue;
          for (const j of arr) {
            if (j <= i) continue;
            resolvePair(a, bodies[j]);
          }
        }
      }
    }
    for (const b of bodies) clampBounds(world, b);
  }

  // -- sleep bookkeeping --
  for (const b of bodies) {
    if (b.sleeping) continue;
    const sp2 = b.vx * b.vx + b.vy * b.vy;
    const resting =
      world.gravitySign > 0
        ? b.y >= floorY - b.r - 2 ||
          hasSupport(bodies, b, floorY)
        : true;
    if (sp2 < SLEEP_SPEED2 && resting) {
      b.calmFrames++;
      if (b.calmFrames >= CALM_FRAMES_NEEDED) {
        b.sleeping = true;
        b.vx = 0;
        b.vy = 0;
        b.va = 0;
      }
    } else {
      b.calmFrames = 0;
    }
  }

  // -- world-level settle: dense piles keep micro-jittering forever, so when
  //    the whole batch is near-still, freeze everyone (casual-physics trick)
  let totalKe = 0;
  let moving = 0;
  for (const b of bodies) {
    if (b.sleeping || b === grabbedBody) continue;
    totalKe += b.vx * b.vx + b.vy * b.vy;
    moving++;
  }
  const still = moving === 0 || totalKe < Math.max(1, moving) * 90 * 90;
  if (still && bodies.length > 0) {
    world.calmTime += dt;
    if (world.calmTime > 0.7) {
      for (const b of bodies) {
        if (!b.sleeping) {
          b.sleeping = true;
          b.vx = 0;
          b.vy = 0;
          b.va = 0;
        }
      }
    }
  } else {
    world.calmTime = 0;
  }

  world.time += dt;
}

// set by the UI layer while a body is being dragged
export let grabbedBody = null;
export function setGrabbed(body) {
  grabbedBody = body;
}

/** Does this body rest on the floor pile or on a sleeping body? */
function hasSupport(bodies, self, floorY) {
  for (const o of bodies) {
    if (o === self || !o.sleeping) continue;
    const dx = o.x - self.x;
    const dy = o.y - self.y;
    const d2 = dx * dx + dy * dy;
    const rr = self.r + o.r;
    // must be genuinely stacked (near touching), not deep-intersecting
    if (d2 < rr * rr && d2 > (rr * 0.45) ** 2 && (_gravDown ? self.y < o.y : self.y > o.y))
      return true;
  }
  return false;
}

// module-level mirror of last gravity sign used by hasSupport
let _gravDown = true;
function worldGravityDown() {
  return _gravDown;
}

function resolvePair(a, b) {
  if (a.sleeping && b.sleeping) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const rr = a.r + b.r;
  let d2 = dx * dx + dy * dy;
  if (d2 >= rr * rr) return;

  if (d2 === 0) {
    // exactly coincident: separate along a random direction
    const ang = Math.random() * Math.PI * 2;
    const nx0 = Math.cos(ang);
    const ny0 = Math.sin(ang);
    const half = rr / 2;
    if (!a.sleeping) {
      a.x -= nx0 * half;
      a.y -= ny0 * half;
    }
    if (!b.sleeping) {
      b.x += nx0 * half;
      b.y += ny0 * half;
    }
    clampBounds(world, a);
    clampBounds(world, b);
    return;
  }

  const d = Math.sqrt(d2);
  const nx = dx / d;
  const ny = dy / d;
  const overlap = rr - d;

  // positional correction ALWAYS — this is what unsticks penetration,
  // even when the pair is already separating (vn > 0)
  const push = overlap / 2;
  if (!a.sleeping) {
    a.x -= nx * push;
    a.y -= ny * push;
  }
  if (!b.sleeping) {
    b.x += nx * push;
    b.y += ny * push;
  }

  // impulse only when approaching
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return;

  wake(a, Math.abs(vn));
  wake(b, Math.abs(vn));
  const j = (-(1 + REST) * vn) / 2;
  const jx = j * nx;
  const jy = j * ny;
  if (!a.sleeping) {
    a.vx -= jx;
    a.vy -= jy;
    a.va += (nx * 0.4 - ny * 0.2) * 0.06 * j;
  }
  if (!b.sleeping) {
    b.vx += jx;
    b.vy += jy;
    b.va += (ny * 0.4 - nx * 0.2) * 0.06 * j;
  }
}

/** Pick the topmost body under (x, y), preferring non-sleeping ones. */
export function pickBody(world, x, y) {
  for (let i = world.bodies.length - 1; i >= 0; i--) {
    const b = world.bodies[i];
    const dx = b.x - x;
    const dy = b.y - y;
    const slack = 8; // easier grabbing
    if (dx * dx + dy * dy <= (b.r + slack) * (b.r + slack)) return b;
  }
  return null;
}

/** Drag a grabbed body toward the pointer; velocity tracks movement for throwing. */
export function dragTo(body, x, y, dt) {
  body.sleeping = false;
  body.calmFrames = 0;
  const nvx = dt > 0 ? (x - body.x) / Math.max(dt, 1 / 240) : 0;
  const nvy = dt > 0 ? (y - body.y) / Math.max(dt, 1 / 240) : 0;
  body.vx = nvx * 0.9;
  body.vy = nvy * 0.9;
  body.x = x;
  body.y = y;
}
