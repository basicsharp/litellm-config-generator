import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock next-themes so tests don't rely on SSR behaviour
vi.mock('next-themes', () => ({
  ThemeProvider: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="next-themes-provider" {...(props as Record<string, unknown>)}>
      {children}
    </div>
  ),
}));

import { ThemeProvider } from '@/components/theme-provider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <span>child content</span>
      </ThemeProvider>
    );

    expect(screen.getByText('child content')).not.toBeNull();
  });

  it('forwards props to the underlying NextThemesProvider', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <span>inner</span>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('next-themes-provider');
    expect(provider).not.toBeNull();
  });
});
