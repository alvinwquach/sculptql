export interface AutocompleteOption {
  label: string;
  detail: string;
  type: 'keyword' | 'table' | 'field' | 'value' | 'text';
  apply?: string;
  boost?: number;
}

export interface CursorPosition {
  line: number;
  ch: number;
}
