import { useCallback, useState } from 'react';

// We must manually declare the return value due to generic types
type TypeReturnValue<D> = [
  D,
  (key: string, value: unknown) => void,
  () => void,
];

export const useFormData = <T,>(initialData: T): TypeReturnValue<T> => {
  const [data, setData] = useState({ ...initialData });

  const onChange = useCallback(
    (key: string, value: unknown) => {
      const newData = { ...data, [key]: value };
      setData(newData);
    },
    [data],
  );

  const clearForm = useCallback(() => {
    setData({ ...initialData });
  }, [initialData]);

  return [data, onChange, clearForm];
};
