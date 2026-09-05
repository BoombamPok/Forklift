import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// vitest.config.mts doesn't set `test.globals: true`, so Testing
// Library's own auto-cleanup (which only fires when it finds `afterEach`
// on the global scope) never triggers - without this, each `render()` in
// a component test file would leak into the next test's DOM.
afterEach(cleanup);

// jsdom doesn't implement these, but Radix's Select (and other
// pointer-driven primitives) call them unconditionally - without a
// no-op stub here, any test that opens a Radix Select throws.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
// cmdk (the Command palette behind the Combobox component) requires
// ResizeObserver, which jsdom also doesn't implement.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
