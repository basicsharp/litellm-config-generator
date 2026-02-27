import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeProviderId } from '../src/lib/normalize-provider';

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
  const discovered = new Set<string>();
  const pyFiles = await listPythonFilesRecursive(providerRoot);
  const getterPattern = /(?:optional_params|litellm_params)\.get\(\s*['"](\w+)['"]\s*(?:,|\))/g;

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
      discovered.add(fieldName);
    }
  }

  return Array.from(discovered)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      type: 'unknown',
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

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const litellmSubmodulePath = path.join(repoRoot, 'litellm');
  const modelPricesPath = path.join(litellmSubmodulePath, 'model_prices_and_context_window.json');
  const routerTypesPath = path.join(litellmSubmodulePath, 'litellm', 'types', 'router.py');
  const llmsRoot = path.join(litellmSubmodulePath, 'litellm', 'llms');
  const outputPath = path.join(repoRoot, 'public', 'catalog.json');

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

  const output: CatalogOutput = {
    meta: {
      generatedAt: new Date().toISOString(),
      litellmSubmodulePath: 'litellm',
    },
    providers,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

  const providerCount = Object.keys(providers).length;
  console.log(`Catalog generated at public/catalog.json with ${providerCount} providers.`);
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
