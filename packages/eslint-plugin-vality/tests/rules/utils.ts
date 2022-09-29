export function permute(
  array: TemplateStringsArray | string[],
  ...segments: (string | number | boolean)[][]
): string[] {
  if (segments.length) {
    return segments[0].flatMap((entry) =>
      permute(
        [array[0] + entry.toString() + array[1], ...array.slice(2)],
        ...segments.slice(1)
      )
    );
  } else {
    return [array.join("")];
  }
}
