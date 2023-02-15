import { ComponentStory, ComponentMeta } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './header';
import { headerLinksExample } from './header-links-example';

export default {
  component: Header,
  title: 'Header',
} as ComponentMeta<typeof Header>;

const Template: ComponentStory<typeof Header> = (args) => (
  <BrowserRouter>
    <Header {...args} />
  </BrowserRouter>
);

export const Default = Template.bind({});
Default.args = {
  userName: 'janedoe@acmecorp.net',
  userLinks: headerLinksExample,
};
