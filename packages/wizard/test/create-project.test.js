import { describe, it, expect } from 'vitest';
import { isKebabCase, isValidAbbreviation, parseJSON } from '../src/steps/create/gather-info.js';
import { resolveTestCommand } from '../src/steps/create/copy-github-actions.js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('gather-info validations', () => {
  describe('isKebabCase', () => {
    it('accepts valid kebab-case strings', () => {
      expect(isKebabCase('my-project')).toBe(true);
      expect(isKebabCase('geniova-kit')).toBe(true);
      expect(isKebabCase('a')).toBe(true);
      expect(isKebabCase('project123')).toBe(true);
      expect(isKebabCase('my-cool-project-v2')).toBe(true);
    });

    it('rejects invalid kebab-case strings', () => {
      expect(isKebabCase('MyProject')).toBe(false);
      expect(isKebabCase('my_project')).toBe(false);
      expect(isKebabCase('my project')).toBe(false);
      expect(isKebabCase('-leading')).toBe(false);
      expect(isKebabCase('trailing-')).toBe(false);
      expect(isKebabCase('')).toBe(false);
      expect(isKebabCase('my--double')).toBe(false);
      expect(isKebabCase('123start')).toBe(false);
    });
  });

  describe('isValidAbbreviation', () => {
    it('accepts valid 3-letter uppercase abbreviations', () => {
      expect(isValidAbbreviation('PLN')).toBe(true);
      expect(isValidAbbreviation('GKT')).toBe(true);
      expect(isValidAbbreviation('ABC')).toBe(true);
    });

    it('rejects invalid abbreviations', () => {
      expect(isValidAbbreviation('pln')).toBe(false);
      expect(isValidAbbreviation('PL')).toBe(false);
      expect(isValidAbbreviation('PLNN')).toBe(false);
      expect(isValidAbbreviation('P1N')).toBe(false);
      expect(isValidAbbreviation('')).toBe(false);
    });
  });

  describe('parseJSON', () => {
    it('parses valid JSON', () => {
      const result = parseJSON('{"apiKey": "abc", "projectId": "my-proj"}');
      expect(result).toEqual({ apiKey: 'abc', projectId: 'my-proj' });
    });

    it('returns null for invalid JSON', () => {
      expect(parseJSON('not json')).toBeNull();
      expect(parseJSON('{broken')).toBeNull();
      expect(parseJSON('')).toBeNull();
    });
  });
});

describe('copy-github-actions', () => {
  describe('resolveTestCommand', () => {
    it('returns pnpm test for all stacks', () => {
      expect(resolveTestCommand('astro-lit')).toBe('pnpm test');
      expect(resolveTestCommand('next')).toBe('pnpm test');
      expect(resolveTestCommand('node')).toBe('pnpm test');
    });

    it('returns pnpm test for unknown stack', () => {
      expect(resolveTestCommand('unknown')).toBe('pnpm test');
    });
  });

  describe('CI template placeholder', () => {
    it('contains {{TEST_COMMAND}} placeholder', () => {
      const ciTemplate = readFileSync(
        resolve(__dirname, '../templates/github-actions/ci.yml'),
        'utf-8'
      );
      expect(ciTemplate).toContain('{{TEST_COMMAND}}');
    });

    it('placeholder can be replaced', () => {
      const ciTemplate = readFileSync(
        resolve(__dirname, '../templates/github-actions/ci.yml'),
        'utf-8'
      );
      const replaced = ciTemplate.replace('{{TEST_COMMAND}}', 'pnpm test');
      expect(replaced).toContain('- run: pnpm test');
      expect(replaced).not.toContain('{{TEST_COMMAND}}');
    });
  });
});

describe('scaffold-project Node.js', () => {
  it('generates correct package.json structure', () => {
    const pkg = {
      name: '@geniova-technologies/test-project',
      version: '0.1.0',
      description: 'Test project',
      main: 'src/index.js',
      type: 'module',
      engines: { node: '>=18' },
      license: 'UNLICENSED',
      scripts: {
        start: 'node src/index.js',
        test: 'vitest run',
      },
    };

    expect(pkg.name).toBe('@geniova-technologies/test-project');
    expect(pkg.type).toBe('module');
    expect(pkg.engines.node).toBe('>=18');
    expect(pkg.scripts.start).toBe('node src/index.js');
    expect(pkg.scripts.test).toBe('vitest run');
  });
});
