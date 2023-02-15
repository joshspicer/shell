import './form-node-rest.scss';
import { HttpMethod, IFormOption, INodeActionData } from '@cased/data';
import {
  Button,
  FormInputText,
  FormKeyValueCreator,
  FormSelect,
} from '@cased/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStoreActions, useStoreState } from '@cased/redux';
import ConvertToSlug from '../../convert-to-slug/convert-to-slug';

export interface INodeRestForm {
  name?: string;
  providerId?: string;
  httpMethod?: HttpMethod;
  path?: string;
  headers: IFormOption[];
  queryParameters: IFormOption[];
}

export interface FormNodeRestProps extends INodeRestForm {
  onSubmit: (form: INodeActionData) => void;
}

export function FormNodeRest({
  name = '',
  providerId = '',
  httpMethod = HttpMethod.GET,
  path = '',
  headers: initHeaders,
  queryParameters,
  onSubmit,
}: FormNodeRestProps) {
  const { apiProviders } = useStoreState((store) => store.runbooks);

  const markFormDirty = useStoreActions(
    (actions) => actions.runbooks.markFormDirty,
  );

  const [form, setForm] = useState({
    name,
    providerId,
    httpMethod,
    path,
    headers: initHeaders,
    queryParameters,
  });

  useEffect(() => {
    setForm({
      name,
      providerId,
      httpMethod,
      path,
      headers: [...initHeaders],
      queryParameters: [...queryParameters],
    });
  }, [name, providerId, httpMethod, path, initHeaders, queryParameters]);

  const providerOptions = useMemo(
    () =>
      apiProviders.map(({ api_name, id }) => ({
        label: api_name,
        value: id,
      })),
    [apiProviders],
  );

  const updateForm = useCallback(
    (key: string, value: unknown) => {
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
        api: {
          providerId: form.providerId,
          httpMethod: form.httpMethod,
          path: form.path,
          headers: form.headers,
          queryParameters: form.queryParameters,
        },
      });
    },
    [form, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
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

      <div className="border-b-2" />

      <div className="flex flex-col space-y-2">
        <FormSelect
          required
          name="providerId"
          label="Provider"
          dataTestId="form-node-rest__provider-id"
          defaultOption="Select a API provider"
          options={providerOptions}
          value={form.providerId}
          onChange={updateForm}
        />

        <FormSelect
          required
          name="httpMethod"
          label="Method"
          defaultOption="Select a HTTP method"
          options={[
            { label: 'GET', value: 'get' },
            { label: 'PUT', value: 'put' },
            { label: 'DELETE', value: 'delete' },
            { label: 'POST', value: 'post' },
          ]}
          value={form.httpMethod}
          onChange={updateForm}
        />

        <FormInputText
          name="path"
          label="Path"
          value={form.path}
          onChange={updateForm}
        />

        <div className="flex flex-col space-y-2">
          <h3>Headers</h3>

          <FormKeyValueCreator
            headerKey="Header"
            headerValue="Value"
            values={form.headers}
            name="headers"
            onChange={updateForm}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <h3>Parameters</h3>
          <FormKeyValueCreator
            headerKey="Query Parameter"
            headerValue="Value"
            values={form.queryParameters}
            name="queryParameters"
            onChange={updateForm}
          />
        </div>
      </div>

      <Button display="primary" type="submit" className="block w-full">
        Save
      </Button>
    </form>
  );
}

export default FormNodeRest;
