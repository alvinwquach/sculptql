import { Compartment } from "@codemirror/state";
import { keymap, drawSelection, EditorView } from "@codemirror/view";
import { autocompletion, startCompletion, CompletionSource } from "@codemirror/autocomplete";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { sql } from "@codemirror/lang-sql";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { createEditorTheme } from "./editorTheme";
import { formatSqlQuery } from "./sqlFormatter";

interface EditorExtensionsConfig {
  languageCompartment: Compartment;
  isMac: boolean;
  sqlCompletion: CompletionSource;
  updateListener: ReturnType<typeof EditorView.updateListener.of>;
  onFormatSql: (formatted: string) => void;
  onRunQuery: (query: string) => void;
  onLogJson?: () => void;
  onExposeConsole?: () => void;
  hasResults?: boolean;
}

export function getEditorExtensions({
  languageCompartment,
  isMac,
  sqlCompletion,
  updateListener,
  onFormatSql,
  onRunQuery,
  onLogJson,
  onExposeConsole,
  hasResults = false,
}: EditorExtensionsConfig) {
  return [
    keymap.of([
      {
        key: isMac ? "Cmd-Shift-f" : "Ctrl-Shift-f",
        run: (view) => {
          const currentText = view.state.doc.toString();
          if (!currentText) return true;

          const formatted = formatSqlQuery(currentText);
          if (formatted) {
            view.dispatch({
              changes: {
                from: 0,
                to: view.state.doc.length,
                insert: formatted,
              },
            });
            onFormatSql(formatted);
          }
          return true;
        },
      },
      { key: "Ctrl-Space", run: startCompletion },
      indentWithTab,
      {
        key: "Mod-Enter",
        run: (view) => {
          const currentQuery = view.state.doc.toString();
          onRunQuery(currentQuery);
          return true;
        },
      },
      {
        key: isMac ? "Cmd-Shift-j" : "Ctrl-Shift-j",
        run: () => {
          if (hasResults && onLogJson) {
            onLogJson();
          }
          return true;
        },
      },
      {
        key: isMac ? "Cmd-Shift-c" : "Ctrl-Shift-c",
        run: () => {
          if (hasResults && onExposeConsole) {
            onExposeConsole();
          }
          return true;
        },
      },
      ...defaultKeymap,
    ]),
    languageCompartment.of(sql()),
    autocompletion({
      override: [sqlCompletion],
      activateOnTyping: true,
      defaultKeymap: true,
      closeOnBlur: true,
      activateOnTypingDelay: 75,
    }),
    drawSelection(),
    createEditorTheme(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    EditorView.lineWrapping,
    updateListener,
  ];
}
