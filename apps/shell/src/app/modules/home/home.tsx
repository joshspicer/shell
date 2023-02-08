import { Button, TextLink } from '@cased/ui';
import { useStoreActions, useStoreState } from '@cased/redux';

export function Home() {
  const user = useStoreState((store) => store.auth.user);
  const login = useStoreActions((store) => store.auth.login);
  const restore = useStoreActions((store) => store.auth.restore);
  const logout = useStoreActions((store) => store.auth.logout);

  return (
    <div className="container mx-auto">
      <h1 className="my-3 text-3xl">Debugging Route</h1>

      <nav className="mb-3">
        <ul className="list-inside list-disc">
          <li>
            <TextLink to="dashboard">Dashboard Page</TextLink>
          </li>

          <li>
            <TextLink to="runbooks/1">Runbooks Page</TextLink>
          </li>

          <li>
            <TextLink to="runbooks">Runbooks List Page</TextLink>
          </li>

          <li>
            <TextLink to="settings">Settings</TextLink>
          </li>

          <li>
            <TextLink to="approvals">Approvals</TextLink>
          </li>

          <li>
            <TextLink to="activities">Activities</TextLink>
          </li>

          <li>
            <TextLink to="auth/login">Login</TextLink>
          </li>
        </ul>
      </nav>

      <div className="mb-3">
        <h2>Login As</h2>

        <ul>
          <li>
            <Button onClick={() => window.location.assign('/v2/auth')}>
              SSO user
            </Button>
          </li>
          <li>
            <Button onClick={() => login({ email: 'admin@cased.dev' })}>
              admin@cased.dev
            </Button>
          </li>
          <li>
            <Button onClick={() => login({ email: 'developer@cased.dev' })}>
              developer@cased.dev
            </Button>
          </li>
          <li>
            <Button onClick={() => login({ email: 'user@cased.dev' })}>
              user@cased.dev
            </Button>
          </li>
          <li>
            <Button onClick={() => login({ email: 'a' })}>Login Fail</Button>
          </li>
        </ul>
      </div>

      <div className="mb-3">
        <h2>Current User</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="mb-3">
        <h2>Restore Existing Token</h2>
        <Button onClick={() => restore()}>Restore</Button>
      </div>

      <div className="mb-3">
        <h2>Sign out</h2>
        <Button onClick={() => logout()}>logout</Button>
      </div>
    </div>
  );
}

export default Home;
