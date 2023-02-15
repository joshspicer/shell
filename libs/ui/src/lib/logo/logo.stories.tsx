import { ComponentStory, ComponentMeta } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Logo } from './logo';

export default {
  component: Logo,
  title: 'Logo',
} as ComponentMeta<typeof Logo>;

const Template: ComponentStory<typeof Logo> = (args) => (
  <BrowserRouter>
    <Logo {...args} />
    <p>Text below the logo</p>
  </BrowserRouter>
);

export const WithText = Template.bind({});

export const ImageOnly = Template.bind({});
ImageOnly.args = {
  withText: false,
};
