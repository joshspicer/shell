import { useCallback } from 'react';

export interface FormProps {
  onSubmit: () => void;
  children: React.ReactNode;
}

/**
 * A simple form wrapper that handles form submissions and spacing between components.
 * This can be used with the `useFormData` hook to generate everything necessary to
 * create a form with our partials library.
 *
 * ```typescript
 * import { Form, FormInputText, useFormData } from '@cased/ui';
 *
 * const myComponent = () => {
 *   const [data, onChange, clearForm] = useFormData({text: ''});
 *
 *   return (
 *     <Form onSubmit={() => console.log(data)}>
 *       <FormInputText label="My Text" name="text" onChange={onChange} />
 *       <Button type="submit">Submit</Button>
 *     </Form>
 * }
 * ```
 */
export function Form({ onSubmit: onSubmitCallback, children }: FormProps) {
  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmitCallback();
    },
    [onSubmitCallback],
  );

  return (
    <form className="space-y-2" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

export default Form;
