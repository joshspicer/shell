import { IApproval } from '@cased/data';
import { Approval, Card, CardBlock, TextBlock } from '@cased/ui';
import { Link } from 'react-router-dom';

type ApprovalsBlockProps = {
  emptyText: string;
  approvals: IApproval[];
};

export default function ApprovalCardCollection({
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
    <div className="flex flex-col space-y-2">
      {approvals.map((approval) => (
        <Link
          className="block"
          to={`/approvals/${approval.id}`}
          key={approval.id}
        >
          <Card hover>
            <CardBlock key={approval.id}>
              <Approval
                requestorEmail={approval.requestor.email}
                responderEmail={approval.responder?.email}
                prompt={approval.destinationServer}
                command={approval.prompt}
                status={approval.status}
                avatarUrl={approval.requestor.avatarUrl}
                createdAt={approval.createdAt}
              />
            </CardBlock>
          </Card>
        </Link>
      ))}
    </div>
  );
}
