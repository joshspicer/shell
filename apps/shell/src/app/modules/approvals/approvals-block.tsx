import { IApproval } from '@cased/data';
import { Approval, CardBlock, TextBlock } from '@cased/ui';

type ApprovalsBlockProps = {
  emptyText: string;
  approvals: IApproval[];
};

export default function ApprovalsBlock({
  approvals,
  emptyText,
}: ApprovalsBlockProps) {
  if (approvals.length === 0) {
    return (
      <CardBlock>
        <TextBlock className="text-center">{emptyText}</TextBlock>
      </CardBlock>
    );
  }

  return (
    <>
      {approvals.map((approval) => (
        <CardBlock key={approval.id}>
          <Approval
            id={approval.id}
            requestorEmail={approval.requestor.email}
            responderEmail={approval.responder?.email}
            prompt={approval.destinationServer}
            command={approval.prompt}
            status={approval.status}
            avatarUrl={approval.requestor.avatarUrl}
            createdAt={approval.createdAt}
          />
        </CardBlock>
      ))}
    </>
  );
}
