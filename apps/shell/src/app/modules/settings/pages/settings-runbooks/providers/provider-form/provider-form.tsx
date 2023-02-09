import { IApiProvider } from '@cased/data';
import { Button, FormInputText, FormPartialHiddenPassword } from '@cased/ui';
import { useCallback, useMemo } from 'react';

export interface ProviderFormProps {
  form: IApiProvider;
  mode?: 'edit' | 'create';
  onSubmit: () => void;
  onChange: (key: string, value: unknown) => void;
  submitText?: string;
  hasPassword?: boolean;
  hasToken?: boolean;
}

export function ProviderForm({
  form,
  mode = 'create',
  onSubmit: submitCallback,
  onChange,
  submitText = 'Create',
  hasPassword,
  hasToken,
}: ProviderFormProps) {
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitCallback();
    },
    [submitCallback],
  );

  const updateForm = useCallback(
    (key: string, value: unknown) => {
      onChange(key, value);
    },
    [onChange],
  );

  const printAuthSelector = useMemo(
    () => (
      <div>
        <Button
          type="button"
          display={form.authType === 'basic' ? 'primary' : 'default'}
          className="!rounded-none !rounded-l"
          onClick={() => updateForm('authType', 'basic')}
        >
          Basic Auth
        </Button>

        <Button
          type="button"
          className="!rounded-none !rounded-r"
          display={form.authType === 'token' ? 'primary' : 'default'}
          onClick={() => updateForm('authType', 'token')}
        >
          Authorization Token
        </Button>
      </div>
    ),
    [form, updateForm],
  );

  const printAuthSettings = useMemo(() => {
    const classNameBasic = form.authType === 'basic' ? '' : 'hidden';
    const classNameToken = form.authType === 'token' ? '' : 'hidden';

    return (
      <>
        <div className={classNameBasic}>
          <FormInputText
            required={form.authType === 'basic'}
            key="username"
            label="Username"
            name="username"
            value={form.username}
            onChange={updateForm}
          />

          {mode === 'edit' ? (
            <FormPartialHiddenPassword
              key="password"
              label="Password"
              name="password"
              defaultValue={hasPassword ? '********' : ''}
              onEdit={() => onChange('password', '')}
              onChange={onChange}
            />
          ) : (
            <FormInputText
              label="Password"
              name="password"
              value={form.password}
              onChange={updateForm}
            />
          )}
        </div>

        <div className={classNameToken}>
          <FormInputText
            required={form.authType === 'token'}
            key="authToken"
            label="Authorization Token"
            name="authToken"
            value={form.authToken}
            onChange={updateForm}
          />

          {mode === 'edit' ? (
            <FormPartialHiddenPassword
              key="secretToken"
              label="Secret Token"
              name="secretToken"
              defaultValue={hasToken ? '********' : ''}
              onEdit={() => onChange('secretToken', '')}
              onChange={onChange}
            />
          ) : (
            <FormInputText
              label="Secret Token"
              name="secretToken"
              value={form.secretToken}
              onChange={updateForm}
            />
          )}
        </div>
      </>
    );
  }, [updateForm, form, mode, hasPassword, onChange, hasToken]);

  return (
    <form data-testid="provider-form" onSubmit={onSubmit} className="space-y-4">
      <FormInputText
        required
        name="name"
        label="API Name"
        value={form.name}
        onChange={updateForm}
      />

      <FormInputText
        required
        name="baseUrl"
        label="Base URL"
        value={form.baseUrl}
        onChange={updateForm}
      />

      {printAuthSelector}
      {printAuthSettings}

      <Button display="primary" type="submit">
        {submitText}
      </Button>
    </form>
  );
}

export default ProviderForm;
