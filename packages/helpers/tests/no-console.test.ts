import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';

const helpersSrcRoot = path.resolve(__dirname, '..', 'src');
const blockedConsoleMethods = new Set(['debug', 'error', 'info', 'log', 'trace', 'warn']);

function collectTypeScriptFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectTypeScriptFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : [];
  });
}

describe('helper package console output', () => {
  it('does not call console methods directly from library source files', () => {
    const offenders: string[] = [];

    for (const filePath of collectTypeScriptFiles(helpersSrcRoot)) {
      const sourceText = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
          const expression = node.expression;
          if (
            ts.isPropertyAccessExpression(expression) &&
            expression.expression.getText(sourceFile) === 'console' &&
            blockedConsoleMethods.has(expression.name.text)
          ) {
            const location = sourceFile.getLineAndCharacterOfPosition(expression.getStart(sourceFile));
            const relativePath = path.relative(helpersSrcRoot, filePath).replace(/\\/g, '/');
            offenders.push(
              `${relativePath}:${location.line + 1}:${location.character + 1} console.${expression.name.text}`,
            );
          }
        }

        ts.forEachChild(node, visit);
      };

      ts.forEachChild(sourceFile, visit);
    }

    expect(offenders).toEqual([]);
  });
});
