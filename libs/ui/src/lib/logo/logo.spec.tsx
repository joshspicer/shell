import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import Logo from './logo';

describe('Logo', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Logo />, { wrapper: BrowserRouter });
    expect(baseElement).toBeTruthy();
  });

  it('should render without text', () => {
    const { baseElement } = render(<Logo withText={false} />, {
      wrapper: BrowserRouter,
    });

    expect(baseElement).toBeTruthy();
  });
});
