import { IApiProvider } from '@cased/data';
import { TextTitle } from '@cased/ui';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreActions } from '@cased/redux';
import SettingsTemplate, { TabId } from '../../../../settings-template';
import ProviderForm from '../provider-form/provider-form';

export function CreateProvider() {
  const navigate = useNavigate();
  const [form, setForm] = useState<IApiProvider>({
    id: '',
    name: '',
    baseUrl: '',
    authType: 'basic',
    username: '',
    password: '',
    authToken: '',
    secretToken: '',
  });

  const create = useStoreActions(
    (actions) => actions.settingsRunbooks.createApiProvider,
  );

  const onChange = useCallback(
    (key: string, value: unknown) => {
      const newForm = { ...form, [key]: value };
      setForm(newForm);
    },
    [form],
  );

  const onSubmit = useCallback(async () => {
    const success = await create({ provider: form });
    if (success) navigate('/settings/runbooks');
  }, [navigate, form, create]);

  return (
    <SettingsTemplate activeTab={TabId.Runbooks}>
      <TextTitle>Create API Provider</TextTitle>
      <ProviderForm onChange={onChange} onSubmit={onSubmit} form={form} />
      <span data-testid="create-provider" className="sr-only" />
    </SettingsTemplate>
  );
}

export default CreateProvider;
