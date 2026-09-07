import {raw} from 'hono/html';
import type {Child} from 'hono/jsx';

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
          <script type="module" src="/scripts/app.js" />
        </head>
        <body>{children}</body>
      </html>
    </>
  );
}
