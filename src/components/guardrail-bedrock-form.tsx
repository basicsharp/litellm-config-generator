'use client';

import React from 'react';

import { EnvVarInput } from '@/components/env-var-input';
import { Input } from '@/components/ui/input';
import type { GuardrailEntry } from '@/lib/schemas';

type GuardrailBedrockFormProps = {
  entry: GuardrailEntry;
  onChange: (next: Partial<GuardrailEntry>) => void;
};

export function GuardrailBedrockForm({ entry, onChange }: GuardrailBedrockFormProps) {
  return (
    <div className="space-y-3 rounded border p-3">
      <p className="text-sm font-medium">Bedrock Settings</p>
      <Input
        aria-label="Guardrail Identifier"
        placeholder="guardrailIdentifier"
        value={entry.guardrailIdentifier ?? ''}
        onChange={(event) => onChange({ guardrailIdentifier: event.target.value })}
      />
      <Input
        aria-label="Guardrail Version"
        placeholder="guardrailVersion"
        value={entry.guardrailVersion ?? ''}
        onChange={(event) => onChange({ guardrailVersion: event.target.value })}
      />
      <div>
        <p className="mb-1 text-xs text-muted-foreground">AWS Region</p>
        <EnvVarInput
          value={entry.aws_region_name}
          onChange={(value) => onChange({ aws_region_name: value })}
        />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">AWS Role</p>
        <EnvVarInput
          value={entry.aws_role_name}
          onChange={(value) => onChange({ aws_role_name: value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={entry.mask_request_content ?? false}
          onChange={(event) => onChange({ mask_request_content: event.target.checked })}
        />
        Mask request content
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={entry.mask_response_content ?? false}
          onChange={(event) => onChange({ mask_response_content: event.target.checked })}
        />
        Mask response content
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={entry.disable_exception_on_block ?? false}
          onChange={(event) => onChange({ disable_exception_on_block: event.target.checked })}
        />
        Disable exception on block
      </label>
    </div>
  );
}
