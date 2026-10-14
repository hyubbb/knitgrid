import assert from 'node:assert/strict';
import test from 'node:test';
import { createProjectNavigation } from '../src/shared/lib/projectNavigation.js';

function setup() {
  const entries = [{ url: 'https://knitgrid.test/?theme=dark#grid', state: { unrelated: true } }];
  let cursor = 0;
  const events = [];
  let controller;
  let dirty = false;
  let pending = null;
  let rendered = null;
  const accepted = [];
  const browser = {
    get location() { return new URL(entries[cursor].url); },
    history: {
      get state() { return entries[cursor].state; },
      replaceState(state, _, url) { entries[cursor] = { state, url }; },
      pushState(state, _, url) {
        entries.splice(cursor + 1);
        entries.push({ state, url });
        cursor += 1;
      },
      go(delta) {
        const destination = cursor + delta;
        if (destination < 0 || destination >= entries.length) return;
        events.push(() => {
          cursor = destination;
          controller.handlePop({
            blocked: dirty || Boolean(pending),
            request(action) { if (!pending) pending = action; },
            accept(project) { rendered = project; accepted.push(project); },
          });
        });
      },
    },
  };
  controller = createProjectNavigation(browser);
  controller.initialize();
  return {
    browser, entries, accepted,
    get cursor() { return cursor; },
    get rendered() { return rendered; },
    get pending() { return pending; },
    get traversing() { return controller.isTraversing(); },
    set dirty(value) { dirty = value; },
    navigate(project, options) { controller.navigate(project, options); rendered = project; },
    go(delta) { browser.history.go(delta); },
    tick() { events.shift()?.(); },
    flush() {
      let count = 0;
      while (events.length) {
        assert.ok(count++ < 20, 'history traversal must settle');
        events.shift()();
      }
    },
    cancel() { pending = null; },
    resolve() { const action = pending; pending = null; action?.(); },
    reinitialize() { controller = createProjectNavigation(browser); controller.initialize(); },
  };
}

function populated() {
  const app = setup();
  app.navigate('new');
  app.navigate('saved-a');
  app.navigate('saved-b');
  return app;
}

test('accepted Back and Forward retain home, new, and saved entries', () => {
  const app = populated();
  const original = structuredClone(app.entries);
  for (const destination of ['saved-a', 'new', null]) {
    app.go(-1);
    app.flush();
    assert.equal(app.rendered, destination);
  }
  for (const destination of ['new', 'saved-a', 'saved-b']) {
    app.go(1);
    app.flush();
    assert.equal(app.rendered, destination);
  }
  assert.deepEqual(app.entries, original);
  assert.equal(app.cursor, 3);
});

test('cancel restores the actual entry before prompting and preserves Forward', () => {
  const app = populated();
  app.go(-1);
  app.flush();
  app.dirty = true;
  const original = structuredClone(app.entries);
  app.go(-2);
  app.tick();
  assert.equal(app.cursor, 0);
  assert.equal(app.pending, null);
  assert.equal(app.traversing, true);
  app.flush();
  assert.equal(app.cursor, 2);
  assert.equal(app.rendered, 'saved-a');
  assert.equal(typeof app.pending, 'function');
  app.cancel();
  assert.deepEqual(app.entries, original);
  app.dirty = false;
  app.go(1);
  app.flush();
  assert.equal(app.rendered, 'saved-b');
});

for (const target of [0, 1, 2]) {
  test(`discard replays the native traversal to entry ${target} without pushing`, () => {
    const app = populated();
    const original = structuredClone(app.entries);
    app.dirty = true;
    app.go(target - 3);
    app.flush();
    assert.equal(app.cursor, 3);
    app.resolve();
    app.flush();
    assert.equal(app.cursor, target);
    assert.equal(app.rendered, [null, 'new', 'saved-a'][target]);
    assert.deepEqual(app.entries, original);
    app.dirty = false;
    app.go(3 - target);
    app.flush();
    assert.equal(app.rendered, 'saved-b');
  });
}

test('save replaces the restored source, then Forward resolution preserves Back', () => {
  const app = populated();
  app.go(-2);
  app.flush();
  app.dirty = true;
  app.go(1);
  app.flush();
  assert.equal(app.cursor, 1);
  app.navigate('saved-new', { replace: true });
  assert.equal(app.entries[1].state.knitGridPosition, 1);
  assert.equal(new URL(app.entries[2].url).searchParams.get('project'), 'saved-a');
  app.dirty = false;
  app.resolve();
  app.flush();
  assert.equal(app.rendered, 'saved-a');
  assert.equal(app.entries.length, 4);
  app.go(-1);
  app.flush();
  assert.equal(app.rendered, 'saved-new');
  app.go(2);
  app.flush();
  assert.equal(app.rendered, 'saved-b');
});

test('another Back while the prompt is pending restores without replacing its target', () => {
  const app = populated();
  app.dirty = true;
  app.go(-1);
  app.flush();
  const pending = app.pending;
  app.go(-3);
  app.flush();
  assert.equal(app.cursor, 3);
  assert.equal(app.pending, pending);
  app.resolve();
  app.flush();
  assert.equal(app.rendered, 'saved-a');
  assert.equal(app.cursor, 2);
});

test('a save finishing during restoration replaces only the source entry', () => {
  const app = populated();
  app.dirty = true;
  app.go(-2);
  app.tick();
  app.navigate('saved-source', { replace: true });
  assert.equal(new URL(app.entries[1].url).searchParams.get('project'), 'new');
  app.flush();
  assert.equal(app.cursor, 3);
  assert.equal(new URL(app.entries[3].url).searchParams.get('project'), 'saved-source');
  assert.equal(app.entries[3].state.knitGridPosition, 3);
  app.resolve();
  app.flush();
  assert.equal(app.rendered, 'new');
  app.dirty = false;
  app.go(2);
  app.flush();
  assert.equal(app.rendered, 'saved-source');
});

test('initialization and replace preserve position, state, query and hash on reload', () => {
  const app = setup();
  assert.equal(app.entries[0].state.knitGridPosition, 0);
  app.navigate('new');
  app.reinitialize();
  app.navigate('saved', { replace: true });
  assert.equal(app.entries[1].state.knitGridPosition, 1);
  assert.equal(app.entries[1].state.unrelated, true);
  const url = new URL(app.entries[1].url);
  assert.equal(url.searchParams.get('theme'), 'dark');
  assert.equal(url.hash, '#grid');
  app.go(-1);
  app.flush();
  assert.equal(app.rendered, null);
  app.go(1);
  app.flush();
  assert.equal(app.rendered, 'saved');
});
