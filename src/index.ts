import fs from "fs";

interface Import {
  line: string;
  static: boolean;
  tokens: string[];
}

function sortImports(imports: Import[]): Import[][] {
  const buckets: { [key: string]: Import[] } = {};

  const addToBucket = (name: string, importElement: Import) => {
    if (!buckets.hasOwnProperty(name)) {
      buckets[name] = [];
    }

    buckets[name].push(importElement);
  };

  if (imports !== undefined) {
    for (let i = 0; i < imports.length; i++) {
      if (imports[i].static) {
        addToBucket("#", imports[i]);
      } else {
        const bucket = imports[i].tokens[0];

        if (
          bucket == "java" ||
          bucket == "javax" ||
          bucket == "com" ||
          bucket == "org"
        ) {
          addToBucket(bucket, imports[i]);
        } else {
          addToBucket("__other__", imports[i]);
        }
      }
    }
  }

  const sortedBuckets: Import[][] = [];

  ["#", "java", "javax", "com", "org", "__other__"].forEach((entry) => {
    if (!buckets.hasOwnProperty(entry)) {
      return;
    }

    buckets[entry].sort((first, second) => compareFqn(first, second));

    sortedBuckets.push(buckets[entry]);
  });

  return sortedBuckets;
}

function compareFqn(
  packageOrTypeNameFirst: Import,
  packageOrTypeNameSecond: Import
) {
  const identifiersFirst = packageOrTypeNameFirst.tokens;
  const identifiersSecond = packageOrTypeNameSecond.tokens;

  const minParts = Math.min(identifiersFirst.length, identifiersSecond.length);
  for (let i = 0; i < minParts; i++) {
    if (identifiersFirst[i] < identifiersSecond[i]) {
      return -1;
    } else if (identifiersFirst[i] > identifiersSecond[i]) {
      return 1;
    }
  }

  if (identifiersFirst.length < identifiersSecond.length) {
    return -1;
  } else if (identifiersFirst.length > identifiersSecond.length) {
    return 1;
  }

  return 0;
}

async function format(content: string) {
  let importsStart = -1;
  let importsEnd = -1;

  const regex = /^import\s*(static)?\s*(.+?);*$/gm;

  const imports: Import[] = [];

  let m;
  while ((m = regex.exec(content)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    imports.push({
      line: m[0],
      static: m[1] == "static",
      tokens: m[2].split("."),
    });

    if (importsStart == -1) {
      importsStart = m.index;
    }
    importsEnd = m.index + m[0].length;
  }

  if (importsStart == -1) {
    return content;
  }

  const sortedImports = sortImports(imports);

  console.log(sortedImports);

  const formattedImports = sortedImports
    .map((importsBucket) => {
      return importsBucket.map((datum) => datum.line).join("\n");
    })
    .join("\n\n");

  return (
    content.substring(0, importsStart) +
    formattedImports +
    content.substring(importsEnd)
  );
}

async function openAndFormat(file: string) {
  const content = await fs.promises.readFile(file, { encoding: "utf-8" });

  const updatedContent = await format(content);

  if (content != updatedContent) {
    await fs.promises.writeFile(file, content);
  }
}

// TODO :: read process.argv for a filename

module.exports = {
  format,
};
