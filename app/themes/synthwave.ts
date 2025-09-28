import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

export const synthwaveTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0a0a0f',
    color: '#ff79c6',
    fontSize: '14px',
    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
  },
  '.cm-content': {
    padding: '16px',
    minHeight: '200px',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-editor': {
    backgroundColor: '#0a0a0f',
  },
  '.cm-scroller': {
    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #ff79c6',
    marginLeft: '-1px',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#ff79c640',
  },
  '.cm-activeLine': {
    backgroundColor: '#1a1a2e40',
  },
  '.cm-gutters': {
    backgroundColor: '#0a0a0f',
    borderRight: '1px solid #ff79c630',
    color: '#ff79c660',
  },
  '.cm-lineNumbers': {
    color: '#ff79c660',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1a1a2e40',
    color: '#ff79c6',
  },
  // SQL syntax highlighting
  '.cm-keyword': {
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  '.cm-string': {
    color: '#f1fa8c',
  },
  '.cm-number': {
    color: '#50fa7b',
  },
  '.cm-comment': {
    color: '#6272a4',
    fontStyle: 'italic',
  },
  '.cm-operator': {
    color: '#ff79c6',
  },
  '.cm-variable': {
    color: '#8be9fd',
  },
  '.cm-function': {
    color: '#50fa7b',
  },
  '.cm-type': {
    color: '#ffb86c',
  },
  '.cm-builtin': {
    color: '#8be9fd',
  },
  '.cm-property': {
    color: '#ff79c6',
  },
  '.cm-attribute': {
    color: '#ff79c6',
  },
  '.cm-tag': {
    color: '#ff79c6',
  },
  '.cm-atom': {
    color: '#bd93f9',
  },
  '.cm-def': {
    color: '#50fa7b',
  },
  '.cm-variable-2': {
    color: '#8be9fd',
  },
  '.cm-variable-3': {
    color: '#8be9fd',
  },
  '.cm-meta': {
    color: '#ff79c6',
  },
  '.cm-qualifier': {
    color: '#ffb86c',
  },
  '.cm-bracket': {
    color: '#ff79c6',
  },
  '.cm-punctuation': {
    color: '#ff79c6',
  },
  '.cm-searching': {
    backgroundColor: '#ff79c640',
    outline: '1px solid #ff79c6',
  },
  '.cm-searchMatch': {
    backgroundColor: '#ff79c640',
    outline: '1px solid #ff79c6',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#ff79c680',
  },
  '.cm-panel': {
    backgroundColor: '#0a0a0f',
    color: '#ff79c6',
    border: '1px solid #ff79c630',
  },
  '.cm-panel.cm-panel-top': {
    borderBottom: '1px solid #ff79c630',
  },
  '.cm-panel.cm-panel-bottom': {
    borderTop: '1px solid #ff79c630',
  },
  '.cm-button': {
    backgroundColor: '#1a1a2e',
    color: '#ff79c6',
    border: '1px solid #ff79c630',
    borderRadius: '4px',
  },
  '.cm-button:hover': {
    backgroundColor: '#ff79c620',
  },
  '.cm-textfield': {
    backgroundColor: '#1a1a2e',
    color: '#ff79c6',
    border: '1px solid #ff79c630',
    borderRadius: '4px',
  },
  '.cm-textfield:focus': {
    borderColor: '#ff79c6',
    outline: 'none',
  },
  '.cm-tooltip': {
    backgroundColor: '#0a0a0f',
    color: '#ff79c6',
    border: '1px solid #ff79c630',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(255, 121, 198, 0.2)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li': {
      padding: '8px 12px',
      borderBottom: '1px solid #ff79c620',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#ff79c620',
      color: '#ff79c6',
    },
  },
  '.cm-completionIcon': {
    fontSize: '16px',
    width: '16px',
    height: '16px',
    marginRight: '8px',
  },
  '.cm-completionIcon-keyword': {
    color: '#8b5cf6',
  },
  '.cm-completionIcon-variable': {
    color: '#8be9fd',
  },
  '.cm-completionIcon-function': {
    color: '#50fa7b',
  },
  '.cm-completionIcon-type': {
    color: '#ffb86c',
  },
  '.cm-completionIcon-property': {
    color: '#ff79c6',
  },
  '.cm-completionIcon-module': {
    color: '#bd93f9',
  },
  '.cm-completionIcon-constant': {
    color: '#50fa7b',
  },
  '.cm-completionIcon-class': {
    color: '#ffb86c',
  },
  '.cm-completionIcon-interface': {
    color: '#8be9fd',
  },
  '.cm-completionIcon-namespace': {
    color: '#bd93f9',
  },
  '.cm-completionIcon-text': {
    color: '#ff79c6',
  },
  '.cm-completionIcon-method': {
    color: '#50fa7b',
  },
  '.cm-completionIcon-field': {
    color: '#8be9fd',
  },
  '.cm-completionIcon-enum': {
    color: '#ffb86c',
  },
  '.cm-completionIcon-snippet': {
    color: '#bd93f9',
  },
  '.cm-completionIcon-color': {
    color: '#ff79c6',
  },
  '.cm-completionIcon-file': {
    color: '#8be9fd',
  },
  '.cm-completionIcon-reference': {
    color: '#50fa7b',
  },
  '.cm-completionIcon-folder': {
    color: '#ffb86c',
  },
  '.cm-completionIcon-enum-member': {
    color: '#bd93f9',
  },
  '.cm-completionIcon-constant': {
    color: '#50fa7b',
  },
  '.cm-completionIcon-struct': {
    color: '#ffb86c',
  },
  '.cm-completionIcon-event': {
    color: '#ff79c6',
  },
  '.cm-completionIcon-operator': {
    color: '#8b5cf6',
  },
  '.cm-completionIcon-type-parameter': {
    color: '#8be9fd',
  },
}, { dark: true });

export const synthwaveExtensions: Extension[] = [synthwaveTheme];

