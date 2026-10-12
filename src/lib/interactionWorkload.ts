export function calculateWorkload(start: number, end: number) {
  let checksum = 0;
  for (let index = start; index < end; index += 1) {
    checksum += Math.sin(index * 0.001) * Math.cos(index * 0.0007);
  }
  return checksum;
}
