import {Alert} from '../ui/Alert.tsx';
import {Button} from '../ui/Button.tsx';
import {Card} from '../ui/Card.tsx';
import {Document} from '../ui/Document.tsx';
import {InputField} from '../ui/Forms.tsx';

type LoginPageProps = {
  error?: string;
  next: string;
};

export function LoginPage({error, next}: LoginPageProps) {
  return (
    <Document title="Sign in">
      <main class="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
        <div
          class="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          class="absolute bottom-0 right-0 -z-10 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-surface-raised/50 blur-3xl"
          aria-hidden="true"
        />

        <div class="w-full max-w-md">
          <header class="mb-8 text-center">
            <div
              class="mx-auto mb-4 grid size-11 place-items-center rounded-xl border border-accent/30 bg-accent/10 shadow-lg shadow-black/20"
              aria-hidden="true"
            >
              <img class="size-6" src="/images/logo.svg" alt="" />
            </div>
            <h1 class="type-brand text-foreground">Atlas</h1>
          </header>

          <Card class="shadow-2xl shadow-black/30" title="Welcome back">
            <form class="space-y-5" method="post" action="/login">
              <input type="hidden" name="next" value={next} />

              {error ? <Alert variant="error">{error}</Alert> : null}

              <InputField
                id="username"
                name="username"
                type="text"
                label="Username"
                autocomplete="username"
                required
                autofocus
              />
              <InputField
                id="password"
                name="password"
                type="password"
                label="Password"
                autocomplete="current-password"
                required
              />

              <Button class="mt-1 w-full" type="submit">
                Sign in
              </Button>
            </form>
          </Card>

          <p class="type-caption mt-6 text-center text-muted">Private access to Atlas</p>
        </div>
      </main>
    </Document>
  );
}
