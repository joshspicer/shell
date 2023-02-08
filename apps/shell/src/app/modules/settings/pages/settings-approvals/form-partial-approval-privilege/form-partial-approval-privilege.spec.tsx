import { ApprovalType } from '@cased/data';
import { render } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { getMockStore } from '@cased/redux';

import FormPartialApprovalPrivilege from './form-partial-approval-privilege';

describe('FormPartialApprovalPrivilege', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <StoreProvider store={getMockStore()}>
        <FormPartialApprovalPrivilege
          id="1"
          approvalRequired={false}
          approvalType={ApprovalType.anyone}
          allowSelfApproval={false}
          onUpdateForm={() => {}}
        />
      </StoreProvider>,
    );

    expect(baseElement).toBeTruthy();
  });
});
