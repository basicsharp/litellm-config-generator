import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { normalizeProviderId } from '../src/lib/normalize-provider';

const execFileAsync = promisify(execFile);

type CatalogFieldType = 'string' | 'number' | 'boolean' | 'unknown';

type CatalogField = {
  name: string;
  type: CatalogFieldType;
  required: boolean;
  secret: boolean;
};

type CatalogModel = {
  id: string;
  mode: string | null;
  maxTokens: number | null;
  inputCostPerToken: number | null;
  outputCostPerToken: number | null;
};

type CatalogProvider = {
  label: string;
  models: CatalogModel[];
  fields: {
    base: CatalogField[];
    extra: CatalogField[];
  };
};

type CatalogOutput = {
  meta: {
    generatedAt: string;
    litellmSubmodulePath: string;
    litellmRef: string;
    litellmCommit: string;
  };
  providers: Record<string, CatalogProvider>;
};

type ModelPriceRecord = {
  litellm_provider?: string;
  mode?: string;
  max_tokens?: number;
  max_input_tokens?: number;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
};

export type VersionEntry = {
  ref: string;
  folderName: string;
  commit: string;
  generatedAt: string;
};

type CatalogIndex = {
  versions: VersionEntry[];
  latest: string;
};

const TARGET_PROVIDERS = [
  'openai',
  'azure',
  'azure_ai',
  'anthropic',
  'bedrock',
  'vertex_ai',
  'gemini',
  'groq',
  'mistral',
  'ollama',
  'hosted_vllm',
] as const;

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  azure: 'Azure OpenAI',
  azure_ai: 'Azure AI',
  anthropic: 'Anthropic',
  bedrock: 'AWS Bedrock',
  vertex_ai: 'Vertex AI',
  gemini: 'Gemini',
  groq: 'Groq',
  mistral: 'Mistral',
  ollama: 'Ollama',
  hosted_vllm: 'Hosted vLLM',
};

const SECRET_FIELD_PATTERN = /(key|secret|token|password|credential)/i;

type CliOptions = {
  ref?: string;
};

export function parseCliArgs(argv = process.argv.slice(2)): CliOptions {
  const parsed = parseArgs({
    args: argv,
    options: {
      ref: {
        type: 'string',
      },
    },
    strict: true,
    allowPositionals: false,
  });

  const ref = parsed.values.ref?.trim();
  if (!ref) {
    return {};
  }

  return { ref };
}

export function sanitizeRef(ref: string): string {
  return ref.replaceAll('/', '__').replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', ['-C', repoPath, ...args]);
  return stdout.trim();
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function resolveCommitSha(repoPath: string): Promise<string> {
  const sha = await runGit(repoPath, ['rev-parse', '--short', 'HEAD']);
  if (!sha) {
    throw new Error(`Unable to resolve commit SHA for ${repoPath}`);
  }
  return sha;
}

export async function addWorktree(
  submodulePath: string,
  worktreePath: string,
  ref: string
): Promise<void> {
  try {
    await runGit(submodulePath, ['worktree', 'add', '--detach', worktreePath, ref]);
  } catch {
    try {
      await runGit(submodulePath, ['fetch', 'origin', ref]);
      await runGit(submodulePath, ['worktree', 'add', '--detach', worktreePath, ref]);
    } catch {
      throw new Error(
        `Unable to resolve ref "${ref}" locally or from origin. Check ref spelling and network access.`
      );
    }
  }
}

type RemoveWorktreeOptions = {
  runGitFn?: (repoPath: string, args: string[]) => Promise<string>;
  removeDirFn?: (dirPath: string) => Promise<void>;
};

export async function removeWorktree(
  submodulePath: string,
  worktreePath: string,
  options: RemoveWorktreeOptions = {}
): Promise<void> {
  const runGitFn = options.runGitFn ?? runGit;
  const removeDirFn =
    options.removeDirFn ??
    (async (dirPath: string) => {
      await fs.rm(dirPath, { recursive: true, force: true });
    });

  try {
    await runGitFn(submodulePath, ['worktree', 'remove', '--force', worktreePath]);
    return;
  } catch (gitError) {
    try {
      await removeDirFn(worktreePath);
      return;
    } catch (removeError) {
      throw new Error(
        `Failed to remove temporary worktree at "${worktreePath}". git worktree remove failed: ${formatUnknownError(gitError)}. filesystem cleanup failed: ${formatUnknownError(removeError)}`
      );
    }
  }
}

async function readCatalogIndex(indexPath: string): Promise<CatalogIndex | null> {
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    return JSON.parse(raw) as CatalogIndex;
  } catch {
    return null;
  }
}

export async function updateIndexJson(outputDir: string, entry: VersionEntry): Promise<void> {
  const indexPath = path.join(outputDir, 'index.json');
  const existing = (await readCatalogIndex(indexPath)) ?? {
    versions: [],
    latest: entry.folderName,
  };

  const existingVersions = await Promise.all(
    existing.versions.map(async (versionEntry) => {
      const catalogPath = path.join(outputDir, versionEntry.folderName, 'catalog.json');
      try {
        await fs.access(catalogPath);
        return versionEntry;
      } catch {
        return null;
      }
    })
  );

  const deduped = existingVersions.filter(
    (version): version is VersionEntry =>
      version !== null && version.folderName !== entry.folderName
  );
  deduped.push(entry);

  const nextIndex: CatalogIndex = {
    versions: deduped,
    latest: entry.folderName,
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(indexPath, JSON.stringify(nextIndex, null, 2) + '\n', 'utf8');
}

function mapPythonType(typeExpression: string): CatalogFieldType {
  const normalized = typeExpression.toLowerCase();
  if (normalized.includes('bool')) {
    return 'boolean';
  }
  if (
    normalized.includes('int') ||
    normalized.includes('float') ||
    normalized.includes('decimal')
  ) {
    return 'number';
  }
  if (normalized.includes('str')) {
    return 'string';
  }
  return 'unknown';
}

function mapDefaultValueType(defaultValue: string | undefined): CatalogFieldType {
  if (!defaultValue) return 'unknown';
  const trimmed = defaultValue.trim();
  if (trimmed === 'True' || trimmed === 'False') return 'boolean';
  if (/^["'][\s\S]*["']$/.test(trimmed)) return 'string';
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return 'number';
  return 'unknown';
}

function isRequiredField(typeExpression: string, hasDefaultValue: boolean): boolean {
  const normalized = typeExpression.toLowerCase();
  if (
    normalized.includes('optional[') ||
    normalized.includes('| none') ||
    normalized.includes('none')
  ) {
    return false;
  }
  return !hasDefaultValue;
}

function buildProviderLabel(providerId: string): string {
  if (PROVIDER_LABELS[providerId]) {
    return PROVIDER_LABELS[providerId];
  }
  return providerId
    .split('_')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
}

function extractClassBlock(content: string, className: string): string {
  const classRegex = new RegExp(`^class\\s+${className}\\b[\\s\\S]*?(?=^class\\s+\\w+|\\Z)`, 'm');
  const match = content.match(classRegex);
  return match?.[0] ?? '';
}

function extractBaseFields(routerPy: string): CatalogField[] {
  const classNames = ['GenericLiteLLMParams', 'LiteLLM_Params', 'CustomPricingLiteLLMParams'];

  const deduped = new Map<string, CatalogField>();

  for (const className of classNames) {
    const classBlock = extractClassBlock(routerPy, className);
    if (!classBlock) {
      continue;
    }

    const lines = classBlock.split('\n');
    for (const line of lines) {
      const fieldMatch = line.match(
        /^\s{4}([a-zA-Z_]\w*)\s*:\s*([^=\n#]+?)(?:\s*=\s*([^#\n]+))?\s*$/
      );
      if (!fieldMatch) {
        continue;
      }
      const [, fieldName, typeExpression, defaultValue] = fieldMatch;
      if (fieldName === 'Config') {
        continue;
      }
      if (deduped.has(fieldName)) {
        continue;
      }
      const hasDefaultValue = typeof defaultValue === 'string' && defaultValue.trim().length > 0;
      deduped.set(fieldName, {
        name: fieldName,
        type: mapPythonType(typeExpression),
        required: isRequiredField(typeExpression, hasDefaultValue),
        secret: SECRET_FIELD_PATTERN.test(fieldName),
      });
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function listPythonFilesRecursive(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'tests' || entry.name === '__pycache__') {
        continue;
      }
      const nested = await listPythonFilesRecursive(fullPath);
      files.push(...nested);
      continue;
    }
    if (!entry.name.endsWith('.py')) {
      continue;
    }
    if (entry.name.startsWith('test_')) {
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

async function extractExtraFields(
  providerRoot: string,
  baseFieldNames: Set<string>
): Promise<CatalogField[]> {
  const discovered = new Map<string, CatalogFieldType>();
  const pyFiles = await listPythonFilesRecursive(providerRoot);
  const getterPattern =
    /(?:optional_params|litellm_params)\.get\(\s*['"](\w+)['"]\s*(?:,\s*(True|False|None|"[^"]*"|'[^']*'|-?\d+(?:\.\d+)?))?\s*[,)]/g;
  const booleanUsagePattern =
    /(?:optional_params|litellm_params)\.get\(\s*['"](\w+)['"]\s*[,)]\s*is\s+(True|False)/g;

  for (const filePath of pyFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    for (const match of content.matchAll(getterPattern)) {
      const fieldName = match[1];
      if (!fieldName) {
        continue;
      }
      if (baseFieldNames.has(fieldName)) {
        continue;
      }
      const inferredType = mapDefaultValueType(match[2]);
      const existing = discovered.get(fieldName);
      if (existing === undefined || (existing === 'unknown' && inferredType !== 'unknown')) {
        discovered.set(fieldName, inferredType);
      }
    }
    for (const match of content.matchAll(booleanUsagePattern)) {
      const fieldName = match[1];
      if (!fieldName || baseFieldNames.has(fieldName)) {
        continue;
      }
      const existing = discovered.get(fieldName);
      if (existing === undefined || existing === 'unknown') {
        discovered.set(fieldName, 'boolean');
      }
    }
  }

  return Array.from(discovered.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, type]) => ({
      name,
      type,
      required: false,
      secret: SECRET_FIELD_PATTERN.test(name),
    }));
}

function extractModelsByProvider(
  modelData: Record<string, ModelPriceRecord>
): Record<string, CatalogModel[]> {
  const grouped: Record<string, CatalogModel[]> = {};

  for (const [modelId, entry] of Object.entries(modelData)) {
    const provider = normalizeProviderId(entry.litellm_provider);
    if (!provider || !TARGET_PROVIDERS.includes(provider as (typeof TARGET_PROVIDERS)[number])) {
      continue;
    }

    const mode = entry.mode ?? null;
    if (mode !== 'chat' && mode !== 'completion') {
      continue;
    }

    const model: CatalogModel = {
      id: modelId,
      mode,
      maxTokens: entry.max_tokens ?? entry.max_input_tokens ?? null,
      inputCostPerToken: entry.input_cost_per_token ?? null,
      outputCostPerToken: entry.output_cost_per_token ?? null,
    };

    if (!grouped[provider]) {
      grouped[provider] = [];
    }
    grouped[provider].push(model);
  }

  for (const provider of Object.keys(grouped)) {
    grouped[provider].sort((a, b) => a.id.localeCompare(b.id));
  }

  return grouped;
}

export async function main(): Promise<void> {
  const { ref } = parseCliArgs();
  const repoRoot = process.cwd();
  const litellmSubmodulePath = path.join(repoRoot, 'litellm');
  const outputRoot = path.join(repoRoot, 'public', 'catalogs');

  let sourceRoot = litellmSubmodulePath;
  let worktreePath: string | null = null;

  if (ref) {
    const folderName = sanitizeRef(ref);
    worktreePath = path.join(
      os.tmpdir(),
      `litellm-worktree-${folderName}-${process.pid}-${Date.now()}`
    );
    await addWorktree(litellmSubmodulePath, worktreePath, ref);
    sourceRoot = worktreePath;
  }

  try {
    const modelPricesPath = path.join(sourceRoot, 'model_prices_and_context_window.json');
    const routerTypesPath = path.join(sourceRoot, 'litellm', 'types', 'router.py');
    const llmsRoot = path.join(sourceRoot, 'litellm', 'llms');

    try {
      await fs.access(modelPricesPath);
      await fs.access(routerTypesPath);
    } catch {
      throw new Error(
        'LiteLLM submodule files are missing. Ensure submodule is initialized and contains model_prices_and_context_window.json and types/router.py.'
      );
    }

    const modelData = await readJsonFile<Record<string, ModelPriceRecord>>(modelPricesPath);
    const routerPy = await fs.readFile(routerTypesPath, 'utf8');
    const resolvedCommit = await resolveCommitSha(sourceRoot);
    const resolvedRef = ref ?? resolvedCommit;
    const folderName = ref ? sanitizeRef(ref) : resolvedCommit;
    const outputPath = path.join(outputRoot, folderName, 'catalog.json');

    const baseFields = extractBaseFields(routerPy);
    const baseFieldNames = new Set(baseFields.map((field) => field.name));
    const modelsByProvider = extractModelsByProvider(modelData);

    const providers: Record<string, CatalogProvider> = {};
    for (const providerId of TARGET_PROVIDERS) {
      const models = modelsByProvider[providerId] ?? [];
      if (models.length === 0) {
        continue;
      }

      const providerDir = path.join(llmsRoot, providerId);
      let extraFields: CatalogField[] = [];
      try {
        await fs.access(providerDir);
        extraFields = await extractExtraFields(providerDir, baseFieldNames);
      } catch {
        extraFields = [];
      }

      providers[providerId] = {
        label: buildProviderLabel(providerId),
        models,
        fields: {
          base: baseFields,
          extra: extraFields,
        },
      };
    }

    const generatedAt = new Date().toISOString();
    const output: CatalogOutput = {
      meta: {
        generatedAt,
        litellmSubmodulePath: 'litellm',
        litellmRef: resolvedRef,
        litellmCommit: resolvedCommit,
      },
      providers,
    };

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

    await updateIndexJson(outputRoot, {
      ref: resolvedRef,
      folderName,
      commit: resolvedCommit,
      generatedAt,
    });

    const providerCount = Object.keys(providers).length;
    console.log(
      `Catalog generated at public/catalogs/${folderName}/catalog.json with ${providerCount} providers.`
    );
  } finally {
    if (worktreePath) {
      try {
        await removeWorktree(litellmSubmodulePath, worktreePath);
      } catch (cleanupError) {
        console.warn(
          `Warning: Failed to clean up temporary worktree at "${worktreePath}": ${formatUnknownError(cleanupError)}`
        );
      }
    }
  }
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to generate catalog: ${message}`);
    process.exit(1);
  });
}
