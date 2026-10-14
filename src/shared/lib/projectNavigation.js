const POSITION = "knitGridPosition";

// Keep the rendered entry's position separate from the browser's position while
// an unsaved-change traversal is being restored or replayed.
export function createProjectNavigation(browser) {
  let position;
  let restoring = null;
  let replaying = null;
  let pendingReplace = null;

  const readProject = () =>
    new URLSearchParams(browser.location.search).get("project");

  const initialize = () => {
    if (position !== undefined) return;
    position = Number.isInteger(browser.history.state?.[POSITION])
      ? browser.history.state[POSITION]
      : 0;
    browser.history.replaceState(
      { ...browser.history.state, [POSITION]: position },
      "",
      browser.location.href,
    );
  };

  return {
    initialize,
    isTraversing: () => restoring !== null || replaying !== null,
    navigate(project, { replace = false } = {}) {
      // A save already in flight can finish before the restoration popstate.
      if (replace && restoring !== null) {
        pendingReplace = { project };
        return;
      }
      initialize();
      const url = new URL(browser.location.href);
      if (project) url.searchParams.set("project", project);
      else url.searchParams.delete("project");
      if (!replace) position += 1;
      browser.history[replace ? "replaceState" : "pushState"](
        { ...browser.history.state, project: project ?? null, [POSITION]: position },
        "",
        url.href,
      );
    },
    handlePop({ blocked, request, accept }) {
      const nextPosition = browser.history.state?.[POSITION];
      // Entries from before this controller was installed have no known offset.
      // Do not rewrite them or manufacture a push on native traversal.
      if (!Number.isInteger(nextPosition)) {
        position = undefined;
        restoring = null;
        replaying = null;
        initialize();
        accept(readProject());
        return;
      }
      if (restoring !== null) {
        if (nextPosition !== position) {
          browser.history.go(position - nextPosition);
          return;
        }
        const target = restoring;
        restoring = null;
        if (pendingReplace) {
          this.navigate(pendingReplace.project, { replace: true });
          pendingReplace = null;
        }
        request(() => {
          replaying = target;
          browser.history.go(target - position);
        });
        return;
      }
      if (replaying !== null) {
        if (nextPosition !== replaying) {
          browser.history.go(replaying - nextPosition);
          return;
        }
        replaying = null;
      } else if (blocked && nextPosition !== position) {
        restoring = nextPosition;
        browser.history.go(position - nextPosition);
        return;
      }
      position = nextPosition;
      accept(readProject());
    },
  };
}
