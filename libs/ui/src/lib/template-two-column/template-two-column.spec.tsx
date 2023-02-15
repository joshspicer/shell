import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import TemplateTwoColumn from './template-two-column';

describe('TemplateTwoColumn', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <TemplateTwoColumn userName="" userLinks={[]} navLinks={[]}>
        <p>test</p>
      </TemplateTwoColumn>,
      { wrapper: BrowserRouter },
    );
    expect(baseElement).toBeTruthy();
  });
});
