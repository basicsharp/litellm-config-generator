import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

describe('ui components smoke', () => {
  it('renders lightweight wrappers', () => {
    render(
      <>
        <Alert>
          <AlertTitle>Alert title</AlertTitle>
          <AlertDescription>Alert desc</AlertDescription>
        </Alert>
        <Badge>Badge</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Card desc</CardDescription>
          </CardHeader>
          <CardContent>Card body</CardContent>
          <CardFooter>Card footer</CardFooter>
        </Card>
        <Separator orientation="horizontal" />
        <Textarea aria-label="Notes" defaultValue="hello" />
        <Toggle aria-label="Toggle">On</Toggle>
      </>
    );

    expect(screen.getByRole('alert').textContent).toContain('Alert title');
    expect(screen.getByText('Badge')).not.toBeNull();
    expect(screen.getByText('Card body')).not.toBeNull();
    expect(screen.getByLabelText('Notes')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Toggle' })).not.toBeNull();
  });

  it('renders tabs and toggle-group primitives', () => {
    render(
      <>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First content</TabsContent>
          <TabsContent value="two">Second content</TabsContent>
        </Tabs>
        <ToggleGroup type="single" defaultValue="a" aria-label="Modes">
          <ToggleGroupItem value="a" aria-label="Mode A">
            A
          </ToggleGroupItem>
          <ToggleGroupItem value="b" aria-label="Mode B">
            B
          </ToggleGroupItem>
        </ToggleGroup>
      </>
    );

    expect(screen.getByText('First content')).not.toBeNull();
    expect(screen.getByRole('radio', { name: 'Mode A' })).not.toBeNull();
  });

  it('renders select, dialog, tooltip, and scroll area containers', () => {
    render(
      <>
        <Select defaultValue="one">
          <SelectTrigger aria-label="Select item">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Items</SelectLabel>
              <SelectItem value="one">One</SelectItem>
              <SelectSeparator />
              <SelectItem value="two">Two</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Dialog desc</DialogDescription>
            </DialogHeader>
            <DialogFooter>Footer</DialogFooter>
          </DialogContent>
        </Dialog>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent>Tip</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ScrollArea className="h-10 w-10">
          <div>Scrollable</div>
        </ScrollArea>
      </>
    );

    expect(screen.getByRole('combobox', { name: 'Select item' })).not.toBeNull();
    expect(screen.getByText('Open')).not.toBeNull();
    expect(screen.getByText('Hover')).not.toBeNull();
    expect(screen.getByText('Scrollable')).not.toBeNull();
  });

  it('renders dropdown menu components', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Item one <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem checked>Checked</DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">Radio A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">Radio B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Sub</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem inset>Inset item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText('Label')).not.toBeNull();
    expect(screen.getByText('Item one')).not.toBeNull();
    expect(screen.getByText('Checked')).not.toBeNull();
    expect(screen.getByText('Radio A')).not.toBeNull();
    expect(screen.getByText('Sub')).not.toBeNull();
    expect(screen.getByText('Inset item')).not.toBeNull();
  });
});
