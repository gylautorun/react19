type LabExports = {
  memory: WebAssembly.Memory;
  alloc: (size: number) => number;
  release: (pointer: number) => void;
  filterImage: (
    pointer: number,
    pixels: number,
    mode: number,
    amount: number,
  ) => void;
  encodeMuLaw: (input: number, output: number, count: number) => void;
  decodeMuLaw: (input: number, output: number, count: number) => void;
  renderFractal: (
    pointer: number,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    span: number,
    iterations: number,
  ) => void;
};

let loaded: Promise<LabExports> | undefined;

export function loadLabWasm(): Promise<LabExports> {
  loaded ??= fetch('/wasm/lab.wasm')
    .then((response) => {
      if (!response.ok)
        throw new Error(`WASM 加载失败：HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((bytes) =>
      WebAssembly.instantiate(bytes, {
        env: {
          abort: () => {
            throw new Error('WASM 运算中止');
          },
        },
      }),
    )
    .then(({ instance }) => instance.exports as LabExports)
    .catch((error: unknown) => {
      loaded = undefined;
      throw error;
    });
  return loaded;
}

export function withWasmBuffer<T>(
  wasm: LabExports,
  byteLength: number,
  run: (pointer: number) => T,
): T {
  const pointer = wasm.alloc(byteLength);
  try {
    return run(pointer);
  } finally {
    wasm.release(pointer);
  }
}
