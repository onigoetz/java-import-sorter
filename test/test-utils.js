/*eslint no-console: ["error", { allow: ["error"] }] */

const { expect } = require("chai");
const { readFileSync } = require("fs");
const { resolve, relative } = require("path");

const { format } = require("../dist/index.js");

function testSample(testFolder, exclusive) {
  const itOrItOnly = exclusive ? it.only : it;
  const inputPath = resolve(testFolder, "_input.java");
  const expectedPath = resolve(testFolder, "_output.java");
  const relativeInputPath = relative(__dirname, inputPath);

  let inputContents;
  let expectedContents;

  before(() => {
    inputContents = readFileSync(inputPath, "utf8");
    expectedContents = readFileSync(expectedPath, "utf8");
  });

  itOrItOnly(`can format <${relativeInputPath}>`, async () => {
    const actual = await format(inputContents);

    expect(actual).to.equal(expectedContents);
  });

  it(`Performs a stable formatting for <${relativeInputPath}>`, async () => {
    const onePass = await format(inputContents);

    const secondPass = await format(onePass);
    expect(onePass).to.equal(secondPass);
  });
}

module.exports = {
  testSample
}
