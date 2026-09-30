export function alloc(size: i32): usize {
  return heap.alloc(<usize>size);
}

export function release(pointer: usize): void {
  heap.free(pointer);
}

export function filterImage(
  pointer: usize,
  pixels: i32,
  mode: i32,
  amount: i32,
): void {
  for (let index = 0; index < pixels; index++) {
    const offset = pointer + <usize>(index * 4);
    const red = <i32>load<u8>(offset);
    const green = <i32>load<u8>(offset + 1);
    const blue = <i32>load<u8>(offset + 2);
    const luminance = (red * 77 + green * 150 + blue * 29) >> 8;

    if (mode == 0) {
      store<u8>(
        offset,
        <u8>((red * (100 - amount) + luminance * amount) / 100),
      );
      store<u8>(
        offset + 1,
        <u8>((green * (100 - amount) + luminance * amount) / 100),
      );
      store<u8>(
        offset + 2,
        <u8>((blue * (100 - amount) + luminance * amount) / 100),
      );
    } else if (mode == 1) {
      store<u8>(
        offset,
        <u8>((red * (100 - amount) + (255 - red) * amount) / 100),
      );
      store<u8>(
        offset + 1,
        <u8>((green * (100 - amount) + (255 - green) * amount) / 100),
      );
      store<u8>(
        offset + 2,
        <u8>((blue * (100 - amount) + (255 - blue) * amount) / 100),
      );
    } else {
      const value: u8 = luminance >= (amount * 255) / 100 ? 255 : 0;
      store<u8>(offset, value);
      store<u8>(offset + 1, value);
      store<u8>(offset + 2, value);
    }
  }
}

function encodeSample(sample: i32): u8 {
  const sign = sample < 0 ? 0x80 : 0;
  let magnitude = sample < 0 ? -sample : sample;
  if (magnitude > 32635) magnitude = 32635;
  magnitude += 132;

  let exponent = 7;
  let mask = 0x4000;
  while (exponent > 0 && (magnitude & mask) == 0) {
    exponent--;
    mask >>= 1;
  }

  return <u8>~(sign | (exponent << 4) | ((magnitude >> (exponent + 3)) & 15));
}

function decodeSample(code: u8): i16 {
  const value: i32 = ~(<i32>code) & 255;
  const magnitude: i32 = (((value & 15) << 3) + 132) << ((value >> 4) & 7);
  const sample: i32 = magnitude - 132;
  return <i16>((value & 0x80) != 0 ? -sample : sample);
}

export function encodeMuLaw(input: usize, output: usize, count: i32): void {
  for (let index = 0; index < count; index++) {
    store<u8>(
      output + <usize>index,
      encodeSample(<i32>load<i16>(input + <usize>(index * 2))),
    );
  }
}

export function decodeMuLaw(input: usize, output: usize, count: i32): void {
  for (let index = 0; index < count; index++) {
    store<i16>(
      output + <usize>(index * 2),
      decodeSample(load<u8>(input + <usize>index)),
    );
  }
}

export function renderFractal(
  pointer: usize,
  width: i32,
  height: i32,
  centerX: f64,
  centerY: f64,
  span: f64,
  maxIterations: i32,
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const real = centerX + (<f64>x / <f64>width - 0.5) * span;
      const imaginary =
        centerY + (<f64>y / <f64>width - <f64>height / <f64>width / 2) * span;
      let zx: f64 = 0;
      let zy: f64 = 0;
      let iteration = 0;

      while (zx * zx + zy * zy <= 4 && iteration < maxIterations) {
        const next = zx * zx - zy * zy + real;
        zy = 2 * zx * zy + imaginary;
        zx = next;
        iteration++;
      }

      const offset = pointer + <usize>((y * width + x) * 4);
      if (iteration == maxIterations) {
        store<u8>(offset, 15);
        store<u8>(offset + 1, 30);
        store<u8>(offset + 2, 37);
      } else {
        const shade = (iteration * 13) & 255;
        store<u8>(offset, <u8>(35 + shade / 3));
        store<u8>(offset + 1, <u8>(78 + shade / 2));
        store<u8>(offset + 2, <u8>(116 + shade / 2));
      }
      store<u8>(offset + 3, 255);
    }
  }
}
