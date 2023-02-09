import {
  Button,
  Card,
  CardBlock,
  CardTitle,
  FormInputCheckbox,
  FormInputText,
  FormInputNumber,
} from '@cased/ui';
import { useCallback, useState } from 'react';
import { ApprovalType, IApprovalProgram } from '@cased/data';
import { useParams } from 'react-router-dom';
import { useStoreActions } from '@cased/redux';
import SettingsTemplate, { TabId } from '../../../../settings-template';
import ReadyGuard from '../../../../../../guards/ready/ready-guard';
import FormPartialApprovalPrivilege from '../../form-partial-approval-privilege/form-partial-approval-privilege';

export function EditProgramApproval() {
  const [form, setForm] = useState<IApprovalProgram>({
    id: '',
    name: '',
    approvalType: ApprovalType.anyone,
    reasonRequired: false,
    blockNewSessions: false,
    approvalRequired: false,
    allowSelfApproval: false,
    customAutoApprovedCommands: '',
    sessionApprovalDuration: 0,
    sessionRequestTimeout: 0,
    restrictedUsers: [],
  });

  const params = useParams<{ id: string }>();

  const get = useStoreActions(
    (actions) => actions.settingsApprovals.retrieveApprovalProgram,
  );

  const set = useStoreActions(
    (actions) => actions.settingsApprovals.submitApprovalProgram,
  );

  const autoUpdate = useStoreActions(
    (actions) => actions.settingsApprovals.autoUpdateApprovalProgram,
  );

  const updateForm = useCallback(
    (key: string, value: unknown) => {
      const newForm = { ...form, [key]: value };
      setForm(newForm);
      autoUpdate({ id: params?.id || '', program: newForm });
    },
    [form, autoUpdate, params],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!params.id) throw new Error('Missing approval program ID');
      await set({ id: params.id, program: form });
    },
    [params, form, set],
  );

  const populate = useCallback(async () => {
    if (!params.id) throw new Error('Missing approval program ID');

    const result = await get({ id: params.id });
    if (!result) return;
    setForm({ ...result });
  }, [get, params]);

  return (
    <ReadyGuard waitFor={populate}>
      <SettingsTemplate
        returnButton={{
          link: '/settings/approvals',
          title: 'Back to all approvals',
        }}
        activeTab={TabId.Approvals}
      >
        <form
          data-testid="edit-program-approval"
          onSubmit={onSubmit}
          className="flex flex-col space-y-4"
        >
          <Card>
            <CardBlock>
              <CardTitle>Approvals for {form.name}</CardTitle>
            </CardBlock>

            <CardBlock>
              <FormInputText
                label="Name"
                description="Press enter to submit changes"
                value={form.name}
                onChange={updateForm}
                name="name"
              />
            </CardBlock>

            <CardBlock>
              <FormInputCheckbox
                label="Reason required"
                description="A reason must be provided before rails can be invoked."
                value={form.reasonRequired}
                onChange={updateForm}
                name="reasonRequired"
              />
            </CardBlock>

            <CardBlock>
              <FormInputCheckbox
                label="Block new sessions if Cased can't be reached"
                description="If Cased can't be reached due to network errors, then deny session requests until the network error is resolved."
                value={form.blockNewSessions}
                onChange={updateForm}
                name="blockNewSessions"
              />
            </CardBlock>

            <FormPartialApprovalPrivilege
              id={params.id || '-1'}
              approvalRequired={form.approvalRequired}
              approvalType={form.approvalType}
              allowSelfApproval={form.allowSelfApproval}
              onUpdateForm={updateForm}
            />

            <CardBlock>
              <FormInputText
                label="Custom auto-approved commands"
                description="Add custom cased/cased commands you'd like to automatically approve. These commands won't require approval. Actions will still be logged. (Enter the values as a comma-separated list)."
                placeholder="init, shell, version"
                value={form.customAutoApprovedCommands}
                onChange={updateForm}
                name="customAutoApprovedCommands"
              />
            </CardBlock>

            <CardBlock>
              <CardTitle>Advanced</CardTitle>

              <FormInputNumber
                label="Session approval duration (in minutes)"
                description="If a user already has an active, approved session for this application, any additional sessions will be automatically approved within this time window. Setting to 0 minutes means every session request must be approved."
                value={form.sessionApprovalDuration}
                onChange={updateForm}
                name="sessionApprovalDuration"
              />

              <FormInputNumber
                label="Session request timeout (in minutes)"
                description="If a session hasn't been approved before this timeout is reached, it must be requested again."
                value={form.sessionRequestTimeout}
                onChange={updateForm}
                name="sessionRequestTimeout"
              />
            </CardBlock>
          </Card>

          <div>
            <Button display="primary" type="submit">
              Update Settings
            </Button>
          </div>
        </form>
      </SettingsTemplate>
    </ReadyGuard>
  );
}

export default EditProgramApproval;
