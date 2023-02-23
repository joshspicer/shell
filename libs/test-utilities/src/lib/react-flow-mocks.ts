/* eslint-disable max-classes-per-file */

let init = false;

class ResizeObserver {
  callback: globalThis.ResizeObserverCallback;

  constructor(callback: globalThis.ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback([{ target } as globalThis.ResizeObserverEntry], this);
  }

  // eslint-disable-next-line class-methods-use-this
  unobserve() {}

  // eslint-disable-next-line class-methods-use-this
  disconnect() {}
}

class DOMMatrixReadOnly {
  m22: number;

  constructor(transform: string) {
    const scale = transform?.match(/scale\(([1-9.])\)/)?.[1];
    this.m22 = scale !== undefined ? +scale : 1;
  }
}

export const mockReactFlow = () => {
  if (!init) {
    Object.defineProperties(global.HTMLElement.prototype, {
      offsetHeight: {
        get() {
          return parseFloat(this.style.height) || 1;
        },
      },
      offsetWidth: {
        get() {
          return parseFloat(this.style.width) || 1;
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.SVGElement as any).prototype.getBBox = () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    init = true;
  }

  global.ResizeObserver = ResizeObserver;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.DOMMatrixReadOnly = DOMMatrixReadOnly as any;
};
