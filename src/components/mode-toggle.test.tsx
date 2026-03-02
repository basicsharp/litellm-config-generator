import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const mockSetTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme: mockSetTheme }),
}));

import { ModeToggle } from '@/components/mode-toggle';

describe('ModeToggle', () => {
  it('renders the toggle trigger button', () => {
    render(<ModeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).not.toBeNull();
  });

  it('has an accessible sr-only label "Toggle theme"', () => {
    render(<ModeToggle />);
    expect(screen.getByText('Toggle theme')).not.toBeNull();
  });

  it('opens dropdown with Light, Dark, and System options', async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(screen.getByRole('menuitem', { name: /light/i })).not.toBeNull();
    expect(screen.getByRole('menuitem', { name: /dark/i })).not.toBeNull();
    expect(screen.getByRole('menuitem', { name: /system/i })).not.toBeNull();
  });

  it('calls setTheme("light") when Light is clicked', async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    await user.click(screen.getByRole('menuitem', { name: /light/i }));

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme("dark") when Dark is clicked', async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    await user.click(screen.getByRole('menuitem', { name: /dark/i }));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme("system") when System is clicked', async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    await user.click(screen.getByRole('menuitem', { name: /system/i }));

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
