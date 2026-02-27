import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '@/components/ui/form';

function SampleForm() {
  const form = useForm<{ name: string }>({
    defaultValues: { name: '' },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <input aria-label="name" {...field} />
            </FormControl>
            <FormDescription>Description</FormDescription>
            <FormMessage>Hint</FormMessage>
          </FormItem>
        )}
      />
    </Form>
  );
}

function Consumer() {
  const field = useFormField();
  return <div>{field.name}</div>;
}

describe('form helpers', () => {
  it('renders field components in context', () => {
    render(<SampleForm />);

    expect(screen.getByText('Name')).not.toBeNull();
    expect(screen.getByLabelText('name')).not.toBeNull();
    expect(screen.getByText('Description')).not.toBeNull();
    expect(screen.getByText('Hint')).not.toBeNull();
  });

  it('throws when missing FormField context', () => {
    const Wrapper = () => {
      const form = useForm<{ name: string }>({ defaultValues: { name: '' } });

      return (
        <Form {...form}>
          <FormItem>
            <Consumer />
          </FormItem>
        </Form>
      );
    };

    expect(() => render(<Wrapper />)).toThrowError(
      'useFormField should be used within <FormField>'
    );
  });

  it('throws when missing FormItem context', () => {
    const Wrapper = () => {
      const form = useForm<{ name: string }>({ defaultValues: { name: '' } });

      return (
        <Form {...form}>
          <FormField control={form.control} name="name" render={() => <Consumer />} />
        </Form>
      );
    };

    expect(() => render(<Wrapper />)).toThrowError('useFormField should be used within <FormItem>');
  });

  it('renders validation message styling and hides empty message', () => {
    const Wrapper = () => {
      const form = useForm<{ name: string }>({
        defaultValues: { name: '' },
        mode: 'onSubmit',
      });

      React.useEffect(() => {
        form.setError('name', { type: 'manual', message: 'Name is required' });
      }, [form]);

      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="name-label">Name</FormLabel>
                <FormControl>
                  <input aria-label="name-error" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input aria-label="name-no-message" {...field} />
                </FormControl>
                <FormMessage>{''}</FormMessage>
              </FormItem>
            )}
          />
        </Form>
      );
    };

    render(<Wrapper />);

    expect(screen.getAllByText('Name is required').length).toBeGreaterThan(0);
    expect(screen.getByTestId('name-label').className).toContain('text-destructive');
  });
});
