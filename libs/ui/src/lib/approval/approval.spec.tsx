import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ApprovalStatus } from '@cased/data';

import Approval from './approval';

describe('Approval', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <Approval
        id="2"
        requestorEmail="bob@bob.com"
        prompt="a-cool-script.sh"
        status={ApprovalStatus.Approved}
        avatarUrl="https://placekitten.com/200/200"
        createdAt={new Date()}
      />,
      { wrapper: BrowserRouter },
    );
    expect(baseElement).toBeTruthy();
  });
});
