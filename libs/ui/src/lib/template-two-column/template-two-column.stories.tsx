import { ComponentStory, ComponentMeta } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';

import { TemplateTwoColumn } from './template-two-column';
import { sampleNav } from '../sidebar/sample-nav';
import { headerLinksExample } from '../header/header-links-example';

export default {
  component: TemplateTwoColumn,
  title: 'Templates / Two Column',
} as ComponentMeta<typeof TemplateTwoColumn>;

const Template: ComponentStory<typeof TemplateTwoColumn> = (args) => (
  <BrowserRouter>
    <TemplateTwoColumn {...args} />
  </BrowserRouter>
);

export const Default = Template.bind({});
Default.args = {
  userName: 'John Doe',
  userLinks: headerLinksExample,
  navLinks: sampleNav,
  activeLinkId: sampleNav[0].id,
  children: (
    <div>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eu magna
        quis arcu imperdiet rutrum et ac orci. Integer nec neque ut tellus
        ornare commodo. Donec non consequat nulla. Mauris consequat diam id
        molestie blandit. Suspendisse sed tellus eget elit ultrices bibendum ut
        at augue. Phasellus sollicitudin arcu in interdum pretium. Mauris
        facilisis turpis eu tellus faucibus, sit amet ornare elit auctor. Nulla
        eget nunc eu diam tempus mollis. Aenean pulvinar sodales pulvinar. Nulla
        pellentesque gravida lacus a feugiat. Fusce mollis gravida nisi, et
        tempus orci porta in.
      </p>
    </div>
  ),
};
