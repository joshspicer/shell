import { render } from '@testing-library/react';

import TextLink from './text-link';

describe('TextLink', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<TextLink>My Link</TextLink>);
    expect(baseElement).toBeTruthy();
  });
});
