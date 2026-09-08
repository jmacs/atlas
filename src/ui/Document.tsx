import {raw} from 'hono/html';
import type {Child} from 'hono/jsx';
import {importMapJson} from '../core/importmap.ts';

type DocumentProps = {
  children: Child;
  title: string;
};

export function Document({children, title}: DocumentProps) {
  return (
    <>
      {raw('<!doctype html>')}
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          <link rel="icon" href="/images/logo.svg" type="image/svg+xml" />
          <link rel="stylesheet" href="/styles/app.css" />
          <script type="importmap">{raw(importMapJson)}</script>
          <script type="module" src="/scripts/app.js" />
        </head>
        <body class="min-h-dvh bg-background text-foreground antialiased">{children}</body>
      </html>
    </>
  );
}
