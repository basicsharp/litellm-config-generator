import { describe, expect, it } from 'vitest';

import { GuardrailEntrySchema } from '@/lib/schemas';

describe('GuardrailEntrySchema', () => {
  it('parses tier-1 provider shapes', () => {
    const presidio = GuardrailEntrySchema.safeParse({
      id: 'g1',
      guardrail_name: 'p',
      guardrail: 'presidio',
      mode: ['pre_call'],
      pii_entities_config: { CREDIT_CARD: 'MASK' },
      _extra: {},
    });
    const bedrock = GuardrailEntrySchema.safeParse({
      id: 'g2',
      guardrail_name: 'b',
      guardrail: 'bedrock',
      mode: ['pre_call'],
      guardrailIdentifier: 'abc',
      guardrailVersion: 'DRAFT',
      _extra: {},
    });
    const azure = GuardrailEntrySchema.safeParse({
      id: 'g3',
      guardrail_name: 'a',
      guardrail: 'azure/text_moderations',
      mode: ['pre_call'],
      severity_threshold: 4,
      _extra: {},
    });
    const contentFilter = GuardrailEntrySchema.safeParse({
      id: 'g4',
      guardrail_name: 'c',
      guardrail: 'litellm_content_filter',
      mode: ['pre_call'],
      categories: [{ category: 'harmful_violence', enabled: true }],
      _extra: {},
    });
    const generic = GuardrailEntrySchema.safeParse({
      id: 'g5',
      guardrail_name: 'g',
      guardrail: 'generic_guardrail_api',
      mode: ['pre_call'],
      unreachable_fallback: 'fail_open',
      _extra: {},
    });

    expect(presidio.success).toBe(true);
    expect(bedrock.success).toBe(true);
    expect(azure.success).toBe(true);
    expect(contentFilter.success).toBe(true);
    expect(generic.success).toBe(true);
  });

  it('rejects invalid entries', () => {
    const missingName = GuardrailEntrySchema.safeParse({
      id: 'g1',
      guardrail: 'presidio',
      mode: ['pre_call'],
      _extra: {},
    });
    const emptyMode = GuardrailEntrySchema.safeParse({
      id: 'g2',
      guardrail_name: 'x',
      guardrail: 'bedrock',
      mode: [],
      _extra: {},
    });

    expect(missingName.success).toBe(false);
    expect(emptyMode.success).toBe(false);
  });
});
