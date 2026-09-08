import {Document} from '../../ui/Document.tsx';

type LoginPageProps = {
  error?: string;
  next: string;
};

export function LoginPage({error, next}: LoginPageProps) {
  return (
    <Document title="Sign in">
      <main>
        <h1>Sign in to Atlas</h1>
        {error ? <p role="alert">{error}</p> : null}
        <form method="post" action="/login">
          <input type="hidden" name="next" value={next} />
          <p>
            <label>
              Username
              <input name="username" type="text" autocomplete="username" required autofocus />
            </label>
          </p>
          <p>
            <label>
              Password
              <input name="password" type="password" autocomplete="current-password" required />
            </label>
          </p>
          <button type="submit">Sign in</button>
        </form>
      </main>
    </Document>
  );
}
