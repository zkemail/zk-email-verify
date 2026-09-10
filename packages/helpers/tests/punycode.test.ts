import fs from 'fs';
import path from 'path';

describe('mailauth punycode dependency', () => {
  const toolsSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'mailauth', 'tools.ts'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  it('uses the userland punycode package instead of the deprecated Node core module', async () => {
    expect(toolsSource).not.toMatch(/from ['"](?:node:)?punycode['"]/);
    expect(toolsSource).toMatch(/from ['"]punycode\/['"]/);
    expect(packageJson.dependencies).toHaveProperty('punycode');

    const warnings: string[] = [];
    const warningListener = (warning: Error & { code?: string }) => warnings.push(warning.code ?? '');

    process.on('warning', warningListener);
    try {
      jest.isolateModules(() => {
        require('../src/lib/mailauth/tools');
      });
      await new Promise((resolve) => setImmediate(resolve));
    } finally {
      process.off('warning', warningListener);
    }

    expect(warnings).not.toContain('DEP0040');
  });
});
