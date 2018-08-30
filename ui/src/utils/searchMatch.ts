export const isSearchMatch = (input: string, searchTerm: string): boolean =>
  input.toLowerCase().includes(searchTerm.toLowerCase())
