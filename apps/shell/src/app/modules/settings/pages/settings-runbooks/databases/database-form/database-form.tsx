import { IRunbookDatabase } from '@cased/data';
import { Button, FormInputText, FormPartialHiddenPassword } from '@cased/ui';
import { useCallback } from 'react';

export interface DatabaseFormProps {
  form: IRunbookDatabase;
  submitText?: string;
  mode?: 'edit' | 'create';
  hasPassword?: boolean;

  onSubmit: () => void;
  onChange: (key: string, value: unknown) => void;
}

export function DatabaseForm({
  form,
  submitText = 'Create',
  mode = 'create',
  hasPassword,
  onSubmit: submitCallback,
  onChange,
}: DatabaseFormProps) {
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

  return (
    <form data-testid="database-form" onSubmit={onSubmit} className="space-y-4">
      <FormInputText
        required
        name="name"
        label="Database Name"
        value={form.name}
        onChange={updateForm}
      />

      <FormInputText
        required
        name="host"
        label="Host"
        value={form.host}
        onChange={updateForm}
      />

      <FormInputText
        required
        name="port"
        label="Port"
        value={form.port}
        onChange={updateForm}
      />

      <FormInputText
        required
        name="label"
        label="Label"
        value={form.label}
        onChange={updateForm}
      />

      <FormInputText
        required
        name="username"
        label="Username"
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
          name="password"
          label="Password"
          value={form.password}
          onChange={updateForm}
        />
      )}

      <Button display="primary" type="submit">
        {submitText}
      </Button>
    </form>
  );
}

export default DatabaseForm;
