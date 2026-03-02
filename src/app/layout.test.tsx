import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RootLayout, { metadata } from '@/app/layout';

vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({ className: 'geist-sans' })),
}));

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('RootLayout', () => {
  it('exposes metadata and renders body wrapper', () => {
    expect(metadata.title).toBe('LiteLLM Config Generator');
    expect(metadata.description).toContain('LiteLLM');

    render(
      <RootLayout>
        <div>content</div>
      </RootLayout>
    );

    expect(screen.getByText('content')).not.toBeNull();
    expect(document.body.className).toContain('antialiased');
  });

  it('renders children through ThemeProvider', () => {
    render(
      <RootLayout>
        <div>themed child</div>
      </RootLayout>
    );

    // Content is accessible — ThemeProvider wraps and passes children through
    expect(screen.getByText('themed child')).not.toBeNull();
  });
});
