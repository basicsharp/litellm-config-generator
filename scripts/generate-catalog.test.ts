import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseCliArgs, sanitizeRef, updateIndexJson, type VersionEntry } from './generate-catalog';

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'catalog-index-test-'));
  tempDirs.push(dir);
  return dir;
}

describe('generate-catalog helpers', () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('sanitizes refs for folder names', () => {
    expect(sanitizeRef('v1.81.13')).toBe('v1.81.13');
    expect(sanitizeRef('feature/some-branch')).toBe('feature__some-branch');
    expect(sanitizeRef('refs/heads/main')).toBe('refs__heads__main');
    expect(sanitizeRef('release@candidate')).toBe('release_candidate');
  });

  it('updates index.json and keeps latest pointer with upsert move-to-end', async () => {
    const outputDir = await createTempDir();

    const first: VersionEntry = {
      ref: 'v1.0.0',
      folderName: 'v1.0.0',
      commit: 'aaaaaaa',
      generatedAt: '2026-01-01T00:00:00Z',
    };
    await mkdir(path.join(outputDir, first.folderName), { recursive: true });
    await writeFile(path.join(outputDir, first.folderName, 'catalog.json'), '{}\n', 'utf8');

    await updateIndexJson(outputDir, first);

    const second: VersionEntry = {
      ref: 'feature/main',
      folderName: 'feature__main',
      commit: 'bbbbbbb',
      generatedAt: '2026-01-02T00:00:00Z',
    };
    await mkdir(path.join(outputDir, second.folderName), { recursive: true });
    await writeFile(path.join(outputDir, second.folderName, 'catalog.json'), '{}\n', 'utf8');

    await updateIndexJson(outputDir, second);
    await updateIndexJson(outputDir, {
      ...first,
      commit: 'ccccccc',
      generatedAt: '2026-01-03T00:00:00Z',
    });

    const indexRaw = await readFile(path.join(outputDir, 'index.json'), 'utf8');
    const indexJson = JSON.parse(indexRaw) as {
      versions: VersionEntry[];
      latest: string;
    };

    expect(indexJson.versions).toHaveLength(2);
    expect(indexJson.versions[0]?.folderName).toBe('feature__main');
    expect(indexJson.versions[1]?.folderName).toBe('v1.0.0');
    expect(indexJson.versions[1]?.commit).toBe('ccccccc');
    expect(indexJson.latest).toBe('v1.0.0');
  });

  it('parses --ref argument and handles empty/missing input', () => {
    expect(parseCliArgs(['--ref', 'v1.2.3'])).toEqual({ ref: 'v1.2.3' });
    expect(parseCliArgs(['--ref', '   feature/main  '])).toEqual({ ref: 'feature/main' });
    expect(parseCliArgs([])).toEqual({});
    expect(parseCliArgs(['--ref', '   '])).toEqual({});
    expect(() => parseCliArgs(['--unknown', 'x'])).toThrow();
  });
});
