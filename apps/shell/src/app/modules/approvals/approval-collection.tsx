import { ApprovalStatus } from '@cased/data';
import { TextTitle } from '@cased/ui';
import { useMemo } from 'react';
import { useStoreState, useStoreActions } from '@cased/redux';
import ApprovalCardCollection from './approval-card-block-collection';
import ReadyGuard from '../../guards/ready/ready-guard';

export default function ApprovalCollection() {
  const approvals = useStoreState((state) => state.approvals.allApprovals);
  const populate = useStoreActions((state) => state.approvals.populateAll);

  const openApprovalElements = useMemo(() => {
    const openApprovals = approvals.filter(
      ({ status }) => status === ApprovalStatus.Open,
    );
    return (
      <ApprovalCardCollection
        approvals={openApprovals}
        emptyText="No open approvals"
      />
    );
  }, [approvals]);

  const closedApprovalElements = useMemo(() => {
    const closedApprovals = approvals.filter(
      ({ status }) => status !== ApprovalStatus.Open,
    );
    return (
      <ApprovalCardCollection
        approvals={closedApprovals}
        emptyText="No closed approvals"
      />
    );
  }, [approvals]);

  return (
    <ReadyGuard waitFor={populate}>
      <TextTitle size="lg" className="mb-4">
        Open approval requests
      </TextTitle>

      {openApprovalElements}

      <TextTitle size="lg" className="mt-8 mb-4">
        Closed approval requests
      </TextTitle>

      {closedApprovalElements}
    </ReadyGuard>
  );
}
