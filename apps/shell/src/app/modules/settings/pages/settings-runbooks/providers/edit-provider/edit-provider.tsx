import { TextTitle } from '@cased/ui';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IApiProvider } from '@cased/data';
import { useStoreActions } from '@cased/redux';
import SettingsTemplate, { TabId } from '../../../../settings-template';
import ProviderForm from '../provider-form/provider-form';
import ReadyGuard from '../../../../../../guards/ready/ready-guard';

export function EditProvider() {
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<IApiProvider>({
    id: '',
    name: '',
    authType: 'basic',
    baseUrl: '',
    username: '',
    authToken: '',
    hasPassword: false,
    hasToken: false,
  });

  const get = useStoreActions(
    (actions) => actions.settingsRunbooks.retrieveApiProvider,
  );

  const set = useStoreActions(
    (actions) => actions.settingsRunbooks.updateApiProvider,
  );

  const autoUpdate = useStoreActions(
    (actions) => actions.settingsRunbooks.autoUpdateApiProvider,
  );

  const updateForm = useCallback(
    (key: string, value: unknown) => {
      const newForm = { ...form, [key]: value };
      setForm(newForm);
      autoUpdate({ id: params?.id || '', provider: newForm });
    },
    [form, autoUpdate, params],
  );

  const populate = useCallback(async () => {
    // istanbul ignore next
    if (!params.id) throw new Error('No id provided');
    const provider = await get({ id: params.id });
    if (!provider) {
      console.error('Provider not found, 404');
      return;
    }

    setForm(provider);
  }, [get, params.id]);

  const onSubmit = useCallback(async () => {
    // istanbul ignore next
    if (!params.id) throw new Error('Missing approval access ID');
    await set({ id: params.id, provider: form });
  }, [params, form, set]);

  return (
    <ReadyGuard waitFor={populate}>
      <SettingsTemplate activeTab={TabId.Runbooks}>
        <TextTitle>Edit API Provider: {params.id}</TextTitle>
        <ProviderForm
          submitText="Save"
          onChange={updateForm}
          form={form}
          onSubmit={onSubmit}
          mode="edit"
          hasPassword={form.hasPassword}
          hasToken={form.hasToken}
        />
        <span data-testid="edit-provider" />
      </SettingsTemplate>
    </ReadyGuard>
  );
}

export default EditProvider;
