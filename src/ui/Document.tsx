import {raw} from 'hono/html';
import type {Child} from 'hono/jsx';
import {CONFIG} from '#lib/config.ts';
import {modules} from '../web.config.ts';
import {generateImportMap} from '../system/importmap.ts';

const importMapJson = generateImportMap([modules.htmx, modules.alpine]);

type DocumentProps = {
  children: Child;
  scripts?: string[];
  stylesheets?: string[];
  title: string;
};

export function Document(props: DocumentProps) {
  const {children, scripts = [], stylesheets = [], title} = props;

  return (
    <>
      {raw('<!doctype html>')}
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="atlas-timezone" content={CONFIG.TIMEZONE} />
          <title>{title}</title>
          <link rel="icon" href="/images/logo.svg" type="image/svg+xml" />
          <link rel="stylesheet" href="/styles/app.css" />
          {stylesheets.map((href) => (
            <link rel="stylesheet" href={href} />
          ))}
          <script type="importmap">{raw(importMapJson)}</script>
          <script type="module" src="/scripts/app.js"></script>
          {scripts.map((src) => (
            <script type="module" src={src}></script>
          ))}
        </head>
        <body class="min-h-dvh bg-background text-foreground antialiased">{children}</body>
      </html>
    </>
  );
}
