import React from 'react';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from 'sonner';
import { CatalogProvider } from '@/lib/catalog-context';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LiteLLM Config Generator',
  description: 'Generate and edit LiteLLM model_list YAML configurations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>
        <CatalogProvider>
          {children}
          <Toaster position="bottom-center" />
        </CatalogProvider>
      </body>
    </html>
  );
}
