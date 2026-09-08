import type {Child} from 'hono/jsx';

import {Document} from './Document.tsx';

type PageProps = {
  children: Child;
  title: string;
};

export function Page({children, title}: PageProps) {
  return (
    <Document title={title}>
      <header>
        <a href="/">Atlas</a>
      </header>
      <main>
        <h1>{title}</h1>
        {children}
      </main>
    </Document>
  );
}
