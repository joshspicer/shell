import { TextTitle } from '@cased/ui';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IRunbookDatabase } from '@cased/data';
import { useStoreActions } from '@cased/redux';
import SettingsTemplate, { TabId } from '../../../../settings-template';
import DatabaseForm from '../database-form/database-form';
import ReadyGuard from '../../../../../../guards/ready/ready-guard';

export function EditDatabase() {
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<IRunbookDatabase>({
    id: '',
    name: '',
    host: '',
    port: '',
    label: '',
    username: '',
    hasPassword: false,
  });

  const get = useStoreActions(
    (actions) => actions.settingsRunbooks.retrieveDatabase,
  );

  const set = useStoreActions(
    (actions) => actions.settingsRunbooks.updateDatabase,
  );

  const autoUpdate = useStoreActions(
    (actions) => actions.settingsRunbooks.autoUpdateDatabase,
  );

  const updateForm = useCallback(
    (key: string, value: unknown) => {
      const newForm = { ...form, [key]: value };
      setForm(newForm);
      autoUpdate({ id: params?.id || '', database: newForm });
    },
    [form, autoUpdate, params],
  );

  const populate = useCallback(async () => {
    // istanbul ignore next
    if (!params.id) throw new Error('No id provided');
    const database = await get({ id: params.id });

    if (!database) {
      console.error('Database not found, 404');
      return;
    }

    setForm(database);
  }, [get, params.id]);

  const onSubmit = useCallback(async () => {
    // istanbul ignore next
    if (!params.id) throw new Error('Missing approval access ID');
    await set({ id: params.id, database: form });
  }, [params, form, set]);

  return (
    <ReadyGuard waitFor={populate}>
      <SettingsTemplate activeTab={TabId.Runbooks}>
        <TextTitle>Edit Database: {params.id}</TextTitle>
        <DatabaseForm
          submitText="Save"
          onChange={updateForm}
          form={form}
          onSubmit={onSubmit}
          mode="edit"
          hasPassword={form.hasPassword}
        />
        <span className="hide" data-testid="edit-database" />
      </SettingsTemplate>
    </ReadyGuard>
  );
}

export default EditDatabase;
