'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { EnvVarValue } from '@/lib/schemas';

type EnvVarInputProps = {
  value?: EnvVarValue;
  onChange: (value: EnvVarValue) => void;
  secret?: boolean;
  literalAriaLabel?: string;
  envAriaLabel?: string;
};

export function EnvVarInput({
  value,
  onChange,
  secret = false,
  literalAriaLabel = 'Literal value',
  envAriaLabel = 'Environment variable name',
}: EnvVarInputProps) {
  const [showSecret, setShowSecret] = useState(false);

  const mode = value?.mode ?? 'literal';
  const literalValue = useMemo(() => {
    if (!value || value.mode !== 'literal') {
      return '';
    }
    return value.value;
  }, [value]);
  const envVarName = useMemo(() => {
    if (!value || value.mode !== 'env') {
      return '';
    }
    return value.varName;
  }, [value]);

  return (
    <div className="space-y-1">
      <ToggleGroup
        className="justify-start"
        type="single"
        value={mode}
        onValueChange={(newValue) => {
          if (newValue === 'env') {
            onChange({ mode: 'env', varName: '' });
          }
          if (newValue === 'literal') {
            onChange({ mode: 'literal', value: '' });
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

      {mode === 'literal' ? (
        <div className="flex items-center space-x-2">
          <Input
            aria-label={literalAriaLabel}
            type={secret && !showSecret ? 'password' : 'text'}
            value={literalValue}
            onChange={(event) => onChange({ mode: 'literal', value: event.target.value })}
            data-lpignore="true"
          />
          {secret ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setShowSecret((current) => !current)}
              aria-label={showSecret ? 'Hide secret' : 'Show secret'}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center">
          <Input
            aria-label={envAriaLabel}
            value={envVarName}
            placeholder="os.environ/"
            onChange={(event) => onChange({ mode: 'env', varName: event.target.value })}
          />
        </div>
      )}
    </div>
  );
}
