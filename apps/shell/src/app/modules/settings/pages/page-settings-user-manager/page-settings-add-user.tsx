import {
  Button,
  Form,
  FormInputText,
  TextBlock,
  TextLink,
  useFormData,
} from '@cased/ui';
import { useStoreActions } from '@cased/redux';
import { useCallback } from 'react';
import SettingsTemplate, { TabId } from '../../settings-template';

export function PageSettingsAddUser() {
  const [data, onChange, clearForm] = useFormData({
    email: '',
    password: '',
  });

  const create = useStoreActions((actions) => actions.users.create);

  const onSubmit = useCallback(async () => {
    const success = await create(data);
    if (success) clearForm();
  }, [data, clearForm, create]);

  return (
    <SettingsTemplate testId="page-settings-add-user" activeTab={TabId.AddUser}>
      <TextBlock>
        This page is for testing the open source project. Email{' '}
        <TextLink href="mailto:team@cased.com">team@cased.com</TextLink> for
        more advanced user management tools.
      </TextBlock>

      <Form onSubmit={onSubmit}>
        <FormInputText
          required
          name="email"
          label="Email"
          value={data.email}
          onChange={onChange}
          type="email"
        />

        <FormInputText
          required
          name="password"
          label="Password"
          value={data.password}
          onChange={onChange}
          type="password"
        />

        <Button type="submit">Create User</Button>
      </Form>

      <TextBlock>
        To manage users visit the{' '}
        <TextLink to="/settings/users">Users and Groups</TextLink> page.
      </TextBlock>
    </SettingsTemplate>
  );
}

export default PageSettingsAddUser;
