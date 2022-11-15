import * as ts from "typescript";

const transformer: ts.TransformerFactory<ts.SourceFile> = (ctx) => {
  return (sourceFile) => {
    return sourceFile;
  };
};

export default transformer;
