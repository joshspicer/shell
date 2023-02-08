import {
  Button,
  Card,
  CardBlock,
  TextBlock,
  Approval,
  ApprovalStatusIcon,
} from '@cased/ui';
import { useParams } from 'react-router-dom';
import { ApprovalStatus } from '@cased/data';
import { useCallback, useMemo } from 'react';
import { useStoreState, useStoreActions } from '@cased/redux';
import ReadyGuard from '../../../guards/ready/ready-guard';
import NotFoundGuard from '../../../guards/not-found/not-found-guard';

function ApprovalField({ label, value }: { label: string; value: string }) {
  return (
    <CardBlock>
      <TextBlock className="flex items-center text-sm font-bold text-zinc-900">
        {label}
      </TextBlock>
      <TextBlock className="text-sm text-zinc-700">{value}</TextBlock>
    </CardBlock>
  );
}

export function Show() {
  const { id } = useParams();
  const approval = useStoreState((state) => state.approvals.approval);
  const populateId = useStoreActions((state) => state.approvals.populateId);
  const updateApproval = useStoreActions(
    (state) => state.approvals.updateApproval,
  );

  const populate = useCallback(() => id && populateId(id), [id, populateId]);
  const approvalElement = useMemo(() => {
    if (!approval) {
      return null;
    }

    const approve = () => {
      updateApproval({ ...approval, status: ApprovalStatus.Approved });
    };

    const deny = () => {
      updateApproval({ ...approval, status: ApprovalStatus.Denied });
    };

    const cancel = () => {
      updateApproval({ ...approval, status: ApprovalStatus.Cancelled });
    };

    return (
      <div className="w-3/4">
        <Approval
          id={approval.id}
          requestorEmail={approval.requestor.email}
          responderEmail={approval.responder?.email}
          prompt={approval.destinationServer}
          command={approval.command}
          status={approval.status}
          avatarUrl={approval.requestor.avatarUrl}
          createdAt={approval.createdAt}
          hideActions
        />

        <Card className="mt-8 mb-6">
          {approval.prompt && (
            <ApprovalField label="Prompt" value={approval.prompt} />
          )}
          {approval.command && (
            <ApprovalField label="Command" value={approval.command} />
          )}
          <ApprovalField
            label="Time"
            value={approval.createdAt.toLocaleString()}
          />
          <ApprovalField label="IP" value={approval.ip} />
          <ApprovalField label="Action" value={approval.action} />
          <ApprovalField
            label="Certificate authentication"
            value={String(approval.certificateAuthentication)}
          />
          <ApprovalField
            label="Destination Server"
            value={approval.destinationServer}
          />
          <ApprovalField
            label="Destination User"
            value={approval.destinationUserName}
          />
          <ApprovalField
            label="Human Location"
            value={approval.humanLocation}
          />
          <ApprovalField label="Port" value={approval.port} />
        </Card>

        {approval.status === ApprovalStatus.Open && (
          <div className="mt-8 flex gap-2">
            <Button display="primary" onClick={() => approve()}>
              Approve
            </Button>
            <Button display="danger" outline onClick={() => deny()}>
              Deny
            </Button>
            <Button onClick={() => cancel()}>Cancel</Button>
          </div>
        )}

        {approval.status !== ApprovalStatus.Open && (
          <ApprovalStatusIcon
            status={approval.status}
            selfApproved={
              approval.requestor.email === approval.responder?.email
            }
          />
        )}
      </div>
    );
  }, [approval, updateApproval]);

  if (!id) {
    return <NotFoundGuard />;
  }

  return <ReadyGuard waitFor={populate}>{approvalElement}</ReadyGuard>;
}

export default Show;
