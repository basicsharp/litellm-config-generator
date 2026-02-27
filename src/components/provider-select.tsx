'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'azure', label: 'Azure OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'bedrock', label: 'AWS Bedrock' },
  { id: 'vertex_ai', label: 'Vertex AI' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'groq', label: 'Groq' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'ollama', label: 'Ollama' },
  { id: 'hosted_vllm', label: 'Hosted vLLM' },
];

type ProviderSelectProps = {
  value: string;
  onChange: (providerId: string) => void;
};

export function ProviderSelect({ value, onChange }: ProviderSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Provider">
        <SelectValue placeholder="Select provider" />
      </SelectTrigger>
      <SelectContent>
        {PROVIDERS.map((provider) => (
          <SelectItem key={provider.id} value={provider.id}>
            {provider.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
