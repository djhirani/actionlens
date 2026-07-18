export type NormalizedText = {
  normalized: string;
  indexMap: number[];
};

const quoteMap: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201a": "'",
  "\u201b": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u201e": '"',
  "\u201f": '"'
};
const dashPattern = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/;

function isLetter(value: string | undefined) {
  return Boolean(value && /\p{L}/u.test(value));
}

export function normalizeTextWithMap(source: string): NormalizedText {
  const output: string[] = [];
  const indexMap: number[] = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index] ?? "";
    if (character === "-" && isLetter(source[index - 1])) {
      const remainder = source.slice(index + 1);
      const lineBreak = remainder.match(/^[ \t]*\r?\n[ \t]*/);
      const nextIndex = lineBreak ? index + 1 + lineBreak[0].length : -1;
      if (lineBreak && isLetter(source[nextIndex]) && /\p{Ll}/u.test(source[nextIndex] ?? "")) {
        index = nextIndex;
        continue;
      }
    }

    const nfkc = character.normalize("NFKC");
    for (const normalizedCharacter of nfkc) {
      const canonical =
        quoteMap[normalizedCharacter] ??
        (dashPattern.test(normalizedCharacter) ? "-" : normalizedCharacter);
      if (/\s/u.test(canonical)) {
        if (output.length && output.at(-1) !== " ") {
          output.push(" ");
          indexMap.push(index);
        }
      } else {
        output.push(canonical);
        indexMap.push(index);
      }
    }
    index += character.length;
  }

  if (output.at(-1) === " ") {
    output.pop();
    indexMap.pop();
  }
  return { normalized: output.join(""), indexMap };
}

export function normalizeText(source: string) {
  return normalizeTextWithMap(source).normalized;
}
