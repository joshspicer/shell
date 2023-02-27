import { ComponentMeta, ComponentStory } from '@storybook/react';
import Button from '../button/button';
import FormInputText from '../form-partials/form-input-text/form-input-text';
import Form from './form';

export default {
  component: Form,
  title: 'Form Partials/Form',
  argTypes: {
    onSubmit: { action: 'onSubmit' },
  },
} as ComponentMeta<typeof Form>;

const Template: ComponentStory<typeof Form> = (args) => (
  <Form {...args}>
    <FormInputText label="Your Input" name="input" onChange={() => {}} />
    <Button type="submit">Submit</Button>
  </Form>
);

export const Default = Template.bind({});
Default.args = {};
