import { FieldType, INodeActionData, INodeForm } from '@cased/data';
import { Button, FormInputText, FormFields } from '@cased/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { useStoreActions } from '@cased/redux';
import ConvertToSlug from '../../convert-to-slug/convert-to-slug';

interface IForm {
  name?: string;
  fields: INodeForm[];
}

export interface FormNodeFormProps extends IForm {
  onSubmit: (form: INodeActionData) => void;
}

export function FormNodeForm({
  name: initName = '',
  fields: initFields,
  onSubmit,
}: FormNodeFormProps) {
  const [fields, setFields] = useState(initFields);

  const markFormDirty = useStoreActions(
    (actions) => actions.runbooks.markFormDirty,
  );

  const [form, setForm] = useState({
    name: initName,
  });

  // Update form when props change
  useEffect(() => {
    setForm({
      name: initName,
    });
  }, [initName]);

  // Update fields when props change
  useEffect(() => {
    setFields([...initFields]);
  }, [initFields]);

  const updateForm = useCallback(
    (key: string, value: unknown) => {
      setForm({ ...form, [key]: value });
      markFormDirty();
    },
    [form, markFormDirty],
  );

  const setFieldValue = useCallback(
    (index: number, value: INodeForm) => {
      const newFields = [...fields];
      newFields[index] = { ...value };
      setFields(newFields);
      markFormDirty();
    },
    [fields, markFormDirty],
  );

  const deleteField = useCallback(
    (index: number) => {
      const newFields = [...fields];
      newFields.splice(index, 1);
      setFields(newFields);
      markFormDirty();
    },
    [fields, markFormDirty],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      onSubmit({
        name: form.name,
        form: fields,
      });
    },
    [form, fields, onSubmit],
  );

  const createField = useCallback(() => {
    setFields([
      ...fields,
      { name: '', type: FieldType.Text, options: [], id: nanoid() },
    ]);

    markFormDirty();
  }, [fields, markFormDirty]);

  const printFields = useMemo(
    () =>
      fields.map(({ name, type, options, id }, index) => (
        <div className="space-y-4" key={id}>
          <FormFields
            name={name}
            id={id}
            type={type}
            options={options}
            onChange={(value) => setFieldValue(index, value)}
            onDelete={() => deleteField(index)}
          />
        </div>
      )),
    [fields, setFieldValue, deleteField],
  );

  return (
    <form onSubmit={handleSubmit} className="mb-2 divide-y">
      <div>
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

      <div className="mb-5 space-y-5 pt-5">
        <Button
          className="mb-2 block w-full"
          type="button"
          display="default"
          onClick={createField}
        >
          Add a form field
        </Button>

        {printFields}
      </div>

      <Button type="submit" display="primary" className="block w-full">
        Save
      </Button>
    </form>
  );
}

export default FormNodeForm;
