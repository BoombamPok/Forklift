import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// vitest.config.mts doesn't set `test.globals: true`, so Testing
// Library's own auto-cleanup (which only fires when it finds `afterEach`
// on the global scope) never triggers - without this, each `render()` in
// a component test file would leak into the next test's DOM.
afterEach(cleanup);
