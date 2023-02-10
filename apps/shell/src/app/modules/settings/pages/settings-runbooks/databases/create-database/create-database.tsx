import { TextTitle } from '@cased/ui';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IRunbookDatabase } from '@cased/data';
import { useStoreActions } from '@cased/redux';
import SettingsTemplate, { TabId } from '../../../../settings-template';
import DatabaseForm from '../database-form/database-form';

export function CreateDatabase() {
  const navigate = useNavigate();
  const [form, setForm] = useState<IRunbookDatabase>({
    id: '',
    name: '',
    host: '',
    port: '',
    label: '',
    password: '',
    username: '',
  });

  const post = useStoreActions(
    (actions) => actions.settingsRunbooks.createDatabase,
  );

  const onSubmit = useCallback(async () => {
    await post({ database: form });
    navigate('/settings/runbooks');
  }, [navigate, form, post]);

  const onChange = useCallback(
    (key: string, value: unknown) => {
      const newForm = { ...form, [key]: value };
      setForm(newForm);
    },
    [form],
  );

  return (
    <SettingsTemplate activeTab={TabId.Runbooks}>
      <TextTitle>Create Database</TextTitle>
      <DatabaseForm form={form} onSubmit={onSubmit} onChange={onChange} />
      <span data-testid="create-database" className="sr-only" />
    </SettingsTemplate>
  );
}

export default CreateDatabase;
