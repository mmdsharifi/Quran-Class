import test from "node:test";
import assert from "node:assert/strict";
import { setupSwipeBack } from "./utils/swipe.ts";

// ---------------------------------------------------------------------------
// Mock DOM element
// ---------------------------------------------------------------------------
class MockElement {
  listeners = {};
  style = { transform: "", transition: "" };
  offsetWidth = 375;

  addEventListener(event, callback, _opts) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function makeOptions(overrides = {}) {
  return {
    playSound: () => {},
    sfxClick: "click.mp3",
    getThreshold: () => 50,
    getWindowWidth: () => 375,
    animationDuration: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// LTR tests (swipe RIGHT to go back)
// ---------------------------------------------------------------------------

test("LTR - successful swipe right triggers back", async () => {
  const container = new MockElement();
  let backCalled = false;
  let sfxPlayed = null;

  const cleanup = setupSwipeBack(container, {
    ...makeOptions(),
    direction: "ltr",
    onBack: () => { backCalled = true; },
    playSound: (sfx) => { sfxPlayed = sfx; },
  });

  container.trigger("touchstart", { touches: [{ clientX: 10, clientY: 50 }] });
  assert.equal(container.style.transition, "none");

  let prevented = false;
  container.trigger("touchmove", {
    touches: [{ clientX: 90, clientY: 50 }], // +80px → past threshold of 50
    preventDefault: () => { prevented = true; },
    cancelable: true,
  });

  assert.equal(prevented, true);
  assert.equal(container.style.transform, "translateX(80px)");

  container.trigger("touchend", {});
  assert.match(container.style.transition, /transform/);

  await new Promise((r) => setTimeout(r, 5));

  assert.equal(backCalled, true);
  assert.equal(sfxPlayed, "click.mp3");

  cleanup();
});

test("LTR - swipe below threshold snaps back", async () => {
  const container = new MockElement();
  let backCalled = false;

  const cleanup = setupSwipeBack(container, {
    ...makeOptions(),
    direction: "ltr",
    onBack: () => { backCalled = true; },
  });

  container.trigger("touchstart", { touches: [{ clientX: 10, clientY: 50 }] });
  container.trigger("touchmove", {
    touches: [{ clientX: 40, clientY: 50 }], // +30px < threshold of 50
    preventDefault: () => {},
    cancelable: true,
  });

  assert.equal(container.style.transform, "translateX(30px)");
  container.trigger("touchend", {});
  assert.equal(container.style.transform, "translateX(0px)");

  await new Promise((r) => setTimeout(r, 5));

  assert.equal(backCalled, false);
  assert.equal(container.style.transform, "");

  cleanup();
});

test("LTR - swipe LEFT is clamped to 0 (wrong direction)", async () => {
  const container = new MockElement();
  let backCalled = false;

  const cleanup = setupSwipeBack(container, {
    ...makeOptions(),
    direction: "ltr",
    onBack: () => { backCalled = true; },
  });

  container.trigger("touchstart", { touches: [{ clientX: 200, clientY: 50 }] });
  container.trigger("touchmove", {
    touches: [{ clientX: 50, clientY: 50 }], // -150px (leftward) → clamped to 0
    preventDefault: () => {},
    cancelable: true,
  });

  assert.equal(container.style.transform, "translateX(0px)");
  container.trigger("touchend", {});

  await new Promise((r) => setTimeout(r, 5));
  assert.equal(backCalled, false);

  cleanup();
});

// ---------------------------------------------------------------------------
// RTL tests (swipe LEFT to go back)
// ---------------------------------------------------------------------------

test("RTL - successful swipe left triggers back", async () => {
  const container = new MockElement();
  let backCalled = false;
  let sfxPlayed = null;

  const cleanup = setupSwipeBack(container, {
    ...makeOptions(),
    direction: "rtl",
    onBack: () => { backCalled = true; },
    playSound: (sfx) => { sfxPlayed = sfx; },
  });

  container.trigger("touchstart", { touches: [{ clientX: 365, clientY: 50 }] });
  assert.equal(container.style.transition, "none");

  let prevented = false;
  container.trigger("touchmove", {
    touches: [{ clientX: 285, clientY: 50 }], // -80px → past threshold of 50
    preventDefault: () => { prevented = true; },
    cancelable: true,
  });

  assert.equal(prevented, true);
  assert.equal(container.style.transform, "translateX(-80px)");

  container.trigger("touchend", {});
  assert.match(container.style.transition, /transform/);

  await new Promise((r) => setTimeout(r, 5));

  assert.equal(backCalled, true);
  assert.equal(sfxPlayed, "click.mp3");

  cleanup();
});

test("RTL - swipe below threshold snaps back", async () => {
  const container = new MockElement();
  let backCalled = false;

  const cleanup = setupSwipeBack(container, {
    ...makeOptions(),
    direction: "rtl",
    onBack: () => { backCalled = true; },
  });

  container.trigger("touchstart", { touches: [{ clientX: 365, clientY: 50 }] });
  container.trigger("touchmove", {
    touches: [{ clientX: 335, clientY: 50 }], // -30px < threshold of 50
    preventDefault: () => {},
    cancelable: true,
  });

  assert.equal(container.style.transform, "translateX(-30px)");
  container.trigger("touchend", {});
  assert.equal(container.style.transform, "translateX(0px)");

  await new Promise((r) => setTimeout(r, 5));

  assert.equal(backCalled, false);
  assert.equal(container.style.transform, "");

  cleanup();
});

test("RTL - swipe RIGHT is clamped to 0 (wrong direction)", async () => {
  const container = new MockElement();
  let backCalled = false;

  const cleanup = setupSwipeBack(container, {
    ...makeOptions(),
    direction: "rtl",
    onBack: () => { backCalled = true; },
  });

  container.trigger("touchstart", { touches: [{ clientX: 10, clientY: 50 }] });
  container.trigger("touchmove", {
    touches: [{ clientX: 200, clientY: 50 }], // +190px (rightward) → clamped to 0
    preventDefault: () => {},
    cancelable: true,
  });

  assert.equal(container.style.transform, "translateX(0px)");
  container.trigger("touchend", {});

  await new Promise((r) => setTimeout(r, 5));
  assert.equal(backCalled, false);

  cleanup();
});

// ---------------------------------------------------------------------------
// Shared behaviour (direction-independent)
// ---------------------------------------------------------------------------

test("Vertical scroll is ignored in both directions", async () => {
  for (const dir of ["ltr", "rtl"]) {
    const container = new MockElement();
    let backCalled = false;

    const cleanup = setupSwipeBack(container, {
      ...makeOptions(),
      direction: dir,
      onBack: () => { backCalled = true; },
    });

    container.trigger("touchstart", { touches: [{ clientX: 10, clientY: 50 }] });

    let prevented = false;
    container.trigger("touchmove", {
      touches: [{ clientX: 15, clientY: 130 }], // dy=80, dx=5 → vertical scroll
      preventDefault: () => { prevented = true; },
      cancelable: true,
    });

    assert.equal(prevented, false, `direction=${dir}: should not prevent default on vertical scroll`);
    assert.equal(container.style.transform, "", `direction=${dir}: no transform on scroll`);

    container.trigger("touchend", {});
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(backCalled, false, `direction=${dir}: no back on scroll`);

    cleanup();
  }
});

test("Desktop layout (>= 1024px) is ignored in both directions", async () => {
  for (const dir of ["ltr", "rtl"]) {
    const container = new MockElement();
    let backCalled = false;

    const cleanup = setupSwipeBack(container, {
      ...makeOptions({ getWindowWidth: () => 1024 }),
      direction: dir,
      onBack: () => { backCalled = true; },
    });

    container.trigger("touchstart", { touches: [{ clientX: 10, clientY: 50 }] });
    container.trigger("touchmove", {
      touches: [{ clientX: 200, clientY: 50 }],
      preventDefault: () => {},
      cancelable: true,
    });

    assert.equal(container.style.transform, "", `direction=${dir}: no transform on desktop`);

    container.trigger("touchend", {});
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(backCalled, false, `direction=${dir}: no back on desktop`);

    cleanup();
  }
});

test("Cleanup removes all event listeners", () => {
  const container = new MockElement();

  const cleanup = setupSwipeBack(container, {
    ...makeOptions(),
    direction: "ltr",
    onBack: () => {},
  });

  const countListeners = () =>
    Object.values(container.listeners).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

  assert.ok(countListeners() > 0, "listeners should be registered");
  cleanup();
  assert.equal(countListeners(), 0, "all listeners removed after cleanup");
});
