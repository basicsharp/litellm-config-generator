'use client';

import React from 'react';

import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { EnvVarValue } from '@/lib/schemas';

type BooleanEnvVarInputProps = {
  value?: boolean | EnvVarValue;
  onChange: (value: boolean | EnvVarValue) => void;
};

export function BooleanEnvVarInput({ value, onChange }: BooleanEnvVarInputProps) {
  const isEnvMode = typeof value === 'object' && value !== null && value.mode === 'env';
  const boolValue = typeof value === 'boolean' ? value : false;
  const envVarName = isEnvMode ? (value as EnvVarValue & { mode: 'env' }).varName : '';

  return (
    <div className="space-y-1">
      <ToggleGroup
        className="justify-start"
        type="single"
        value={isEnvMode ? 'env' : 'literal'}
        onValueChange={(newMode) => {
          if (newMode === 'env') {
            onChange({ mode: 'env', varName: '' });
          }
          if (newMode === 'literal') {
            onChange(false);
          }
        }}
        aria-label="Select input mode"
      >
        <ToggleGroupItem value="literal" aria-label="Literal mode" size="sm">
          Literal
        </ToggleGroupItem>
        <ToggleGroupItem value="env" aria-label="Env var mode" size="sm">
          Env Var
        </ToggleGroupItem>
      </ToggleGroup>

      {isEnvMode ? (
        <div className="flex items-center">
          <Input
            aria-label="Environment variable name"
            value={envVarName}
            placeholder="os.environ/"
            onChange={(e) => onChange({ mode: 'env', varName: e.target.value })}
          />
        </div>
      ) : (
        <ToggleGroup
          className="justify-start"
          type="single"
          value={String(boolValue)}
          onValueChange={(v) => {
            if (v) onChange(v === 'true');
          }}
          aria-label="Boolean value"
        >
          <ToggleGroupItem value="true" aria-label="True" size="sm">
            True
          </ToggleGroupItem>
          <ToggleGroupItem value="false" aria-label="False" size="sm">
            False
          </ToggleGroupItem>
        </ToggleGroup>
      )}
    </div>
  );
}
