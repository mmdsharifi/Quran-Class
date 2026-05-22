import test from "node:test";
import assert from "node:assert/strict";
import { setupSwipeBack } from "./utils/swipe.ts";

class MockElement {
  listeners = {};
  style = { transform: "", transition: "" };
  offsetWidth = 375;

  addEventListener(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

test("setupSwipeBack - successful horizontal drag to back", async () => {
  const container = new MockElement();
  let backCalled = false;
  let sfxPlayed = null;

  const cleanup = setupSwipeBack(container, {
    onBack: () => { backCalled = true; },
    playSound: (sfx) => { sfxPlayed = sfx; },
    sfxClick: "click.mp3",
    getThreshold: () => 50,
    getWindowWidth: () => 375,
    animationDuration: 1 // 1ms for test determinism
  });

  // Simulate Touch Start
  container.trigger("touchstart", {
    touches: [{ clientX: 10, clientY: 50 }],
    preventDefault: () => {}
  });

  assert.equal(container.style.transition, "none");

  // Simulate Touch Move (horizontal swipe right by 80px)
  let preventDefaultCalled = false;
  container.trigger("touchmove", {
    touches: [{ clientX: 90, clientY: 50 }],
    preventDefault: () => { preventDefaultCalled = true; },
    cancelable: true
  });

  assert.equal(preventDefaultCalled, true);
  assert.equal(container.style.transform, "translateX(80px)");

  // Simulate Touch End
  container.trigger("touchend", {});

  assert.match(container.style.transition, /transform/);

  // Wait for the animation callback
  await new Promise(resolve => setTimeout(resolve, 5));

  assert.equal(backCalled, true);
  assert.equal(sfxPlayed, "click.mp3");

  cleanup();
});

test("setupSwipeBack - swipe cancelled below threshold", async () => {
  const container = new MockElement();
  let backCalled = false;

  const cleanup = setupSwipeBack(container, {
    onBack: () => { backCalled = true; },
    playSound: () => {},
    sfxClick: "click.mp3",
    getThreshold: () => 50,
    getWindowWidth: () => 375,
    animationDuration: 1
  });

  container.trigger("touchstart", {
    touches: [{ clientX: 10, clientY: 50 }]
  });

  container.trigger("touchmove", {
    touches: [{ clientX: 40, clientY: 50 }],
    preventDefault: () => {},
    cancelable: true
  });

  assert.equal(container.style.transform, "translateX(30px)");

  container.trigger("touchend", {});

  // Right after triggering, it should transition to 0px
  assert.equal(container.style.transform, "translateX(0px)");

  await new Promise(resolve => setTimeout(resolve, 5));

  // Should spring back to 0 and get cleaned up to ""
  assert.equal(backCalled, false);
  assert.equal(container.style.transform, "");

  cleanup();
});

test("setupSwipeBack - ignored vertical scroll gesture", async () => {
  const container = new MockElement();
  let backCalled = false;

  const cleanup = setupSwipeBack(container, {
    onBack: () => { backCalled = true; },
    playSound: () => {},
    sfxClick: "click.mp3",
    getThreshold: () => 50,
    getWindowWidth: () => 375,
    animationDuration: 1
  });

  container.trigger("touchstart", {
    touches: [{ clientX: 10, clientY: 50 }]
  });

  let preventDefaultCalled = false;
  // Swipe vertically (dy = 80, dx = 5)
  container.trigger("touchmove", {
    touches: [{ clientX: 15, clientY: 130 }],
    preventDefault: () => { preventDefaultCalled = true; }
  });

  // Vertical scroll should not trigger preventDefault or transform the container
  assert.equal(preventDefaultCalled, false);
  assert.equal(container.style.transform, "");

  container.trigger("touchend", {});

  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(backCalled, false);

  cleanup();
});

test("setupSwipeBack - ignored on desktop layout (window width >= 1024)", async () => {
  const container = new MockElement();
  let backCalled = false;

  const cleanup = setupSwipeBack(container, {
    onBack: () => { backCalled = true; },
    playSound: () => {},
    sfxClick: "click.mp3",
    getThreshold: () => 50,
    getWindowWidth: () => 1024,
    animationDuration: 1
  });

  container.trigger("touchstart", {
    touches: [{ clientX: 10, clientY: 50 }]
  });

  container.trigger("touchmove", {
    touches: [{ clientX: 90, clientY: 50 }],
    preventDefault: () => {}
  });

  assert.equal(container.style.transform, "");

  container.trigger("touchend", {});

  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(backCalled, false);

  cleanup();
});
