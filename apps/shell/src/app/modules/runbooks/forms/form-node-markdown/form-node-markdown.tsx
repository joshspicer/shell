import { INodeActionData } from '@cased/data';
import { Button, FormInputText, FormTextarea } from '@cased/ui';
import { useCallback, useEffect, useState } from 'react';
import { useStoreActions } from '@cased/redux';
import ConvertToSlug from '../../convert-to-slug/convert-to-slug';
import './form-node-markdown.scss';

export interface INodeMarkdownForm {
  name?: string;
  text?: string;
}

export interface FormNodeMarkdownProps extends INodeMarkdownForm {
  onSubmit: (form: INodeActionData) => void;
}

export function FormNodeMarkdown({
  name = '',
  text = '',
  onSubmit,
}: FormNodeMarkdownProps) {
  const markFormDirty = useStoreActions(
    (actions) => actions.runbooks.markFormDirty,
  );
  const [form, setForm] = useState({
    name,
    text,
  });

  useEffect(() => {
    setForm({
      name,
      text,
    });
  }, [name, text]);

  const updateForm = useCallback(
    (key: string, value: string) => {
      setForm({ ...form, [key]: value });
      markFormDirty();
    },
    [form, markFormDirty],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      onSubmit({
        name: form.name,
        markdown: {
          content: form.text,
        },
      });
    },
    [form, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="mb-2 divide-y">
      <div className="form-node-markdown__basics">
        <h2 className="font-bold">Basics</h2>

        <div className="overflow-x-auto">
          <pre>
            Slug: <ConvertToSlug text={form.name} />
          </pre>
        </div>

        <div className="mb-2">
          <FormInputText
            name="name"
            label="Name"
            value={form.name}
            required
            onChange={updateForm}
          />
        </div>
      </div>

      <div className="form-node-markdown__content mb-2 pt-5">
        <FormTextarea
          name="text"
          label="Markdown"
          value={form.text}
          onChange={updateForm}
          rows={8}
        />
      </div>

      <Button display="primary" type="submit" className="block w-full">
        Save
      </Button>
    </form>
  );
}

export default FormNodeMarkdown;
