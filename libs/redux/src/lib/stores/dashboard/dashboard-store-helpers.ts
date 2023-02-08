import { IPrompt } from '@cased/data';

export const filterPromptsBySearch = (
  allPrompts: IPrompt[],
  search: string,
) => {
  const result = allPrompts.filter((prompt) => {
    const nameMatch = prompt.name.toLowerCase().includes(search.toLowerCase());
    const labelMatch = Object.entries(prompt.labels).some(([key, value]) => {
      const [searchKey, searchValue] = search.split('=');
      if (searchKey && searchValue) {
        return (
          key.toLowerCase() === searchKey.toLowerCase() &&
          value.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
      return (
        key.toLowerCase().includes(search.toLowerCase()) ||
        value.toLowerCase().includes(search.toLowerCase())
      );
    });
    return nameMatch || labelMatch;
  });
  return result;
};
