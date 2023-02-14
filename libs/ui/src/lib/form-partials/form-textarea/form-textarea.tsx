import './form-textarea.scss';
import React, { useCallback } from 'react';

export interface FormTextareaProps {
  required?: boolean;
  name: string;
  value?: string;
  label: string;
  rows?: number;
  onChange: (name: string, value: string) => void;
}

export function FormTextarea({
  required,
  name,
  value,
  label,
  rows = 2,
  onChange,
}: FormTextareaProps) {
  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(name, e.target.value);
    },
    [name, onChange],
  );

  return (
    <label>
      <span className="label label-text">{label}</span>
      <textarea
        className="textarea textarea-bordered block w-full"
        rows={rows}
        name={name}
        value={value}
        required={required}
        onChange={onInputChange}
      />
    </label>
  );
}

export default FormTextarea;
