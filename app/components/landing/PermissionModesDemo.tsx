"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PermissionMode = "read-only" | "read-write" | "full";

interface ModeConfig {
  label: string;
  icon: typeof Shield;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}

export default function PermissionModesDemo() {
  const [selectedMode, setSelectedMode] = useState<PermissionMode>("read-only");
  const editorRef = useRef<HTMLDivElement>(null);
  const modeRefs = useRef<HTMLButtonElement[]>([]);

  const modeConfig: Record<PermissionMode, ModeConfig> = {
    "read-only": {
      label: "READ-ONLY",
      icon: ShieldAlert,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-300",
      description: "Only SELECT and read operations",
    },
    "read-write": {
      label: "READ-WRITE",
      icon: Shield,
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-300",
      description: "SELECT, INSERT, and UPDATE",
    },
    full: {
      label: "FULL ACCESS",
      icon: ShieldCheck,
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      textColor: "text-emerald-300",
      description: "All SQL operations",
    },
  };

  const customTheme = EditorView.theme(
    {
      "&": {
        backgroundColor: "#0a0a0f",
        color: "#e0e6ed",
        fontSize: "clamp(13px, 2.5vw, 15px)",
        height: "100%",
        background: "#0a0a0f",
        position: "relative",
        overflow: "hidden",
      },
      ".cm-scroller": {
        backgroundColor: "#0a0a0f",
      },
      ".cm-editor": {
        backgroundColor: "#0a0a0f",
      },
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(244, 114, 182, 0.05), rgba(16, 185, 129, 0.05))",
        pointerEvents: "none",
        zIndex: 0,
      },
      ".cm-content": {
        caretColor: "#f472b6",
        padding: "1rem",
        minHeight: "auto",
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
        lineHeight: "1.8",
        position: "relative",
        zIndex: 1,
        backgroundColor: "#0a0a0f",
      },
      ".cm-line": {
        backgroundColor: "transparent",
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
      },
      ".cm-keyword": {
        color: "#f472b6 !important",
        fontWeight: "700",
        textShadow: "0 0 12px rgba(244, 114, 182, 0.6)",
        background: "linear-gradient(135deg, #f472b6, #ec4899)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      },
      ".cm-operator": {
        color: "#8b5cf6 !important",
        fontWeight: "600",
        textShadow: "0 0 8px rgba(139, 92, 246, 0.5)",
      },
      ".cm-variableName": {
        color: "#fbbf24 !important",
        textShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
        fontWeight: "600",
      },
      ".cm-string": {
        color: "#10b981",
        textShadow: "0 0 8px rgba(16, 185, 129, 0.4)",
        fontWeight: "500",
      },
      ".cm-comment": {
        color: "#6b7280",
        fontStyle: "italic",
        opacity: 0.8,
      },
      ".cm-number": {
        color: "#f59e0b",
        fontWeight: "700",
        textShadow: "0 0 6px rgba(245, 158, 11, 0.4)",
      },
      ".cm-gutters": {
        backgroundColor: "#1a1a2e",
        color: "#8b5cf6",
        border: "none",
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        boxShadow:
          "2px 0 15px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(139, 92, 246, 0.2)",
      },
      ".cm-lineNumbers": {
        color: "#8b5cf6",
        textShadow: "0 0 5px rgba(139, 92, 246, 0.4)",
      },
    },
    { dark: true }
  );

  const queries = useMemo(
    () => ({
      "read-only": `-- READ-ONLY MODE: Safe data exploration
-- ✓ Allowed operations shown below

-- ✓ SELECT: Read data from tables
SELECT * FROM users
WHERE status = 'active';

-- ✓ JOIN: Combine data from multiple tables
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- ✓ AGGREGATE: Analyze data
SELECT COUNT(*), AVG(age)
FROM users;

-- ✗ BLOCKED: INSERT - Cannot add new records
-- INSERT INTO users (name, email) VALUES ('John', 'john@example.com');

-- ✗ BLOCKED: UPDATE - Cannot modify existing data
-- UPDATE users SET status = 'inactive' WHERE id = 1;

-- ✗ BLOCKED: DELETE - Cannot remove records
-- DELETE FROM users WHERE id = 1;`,

      "read-write": `-- READ-WRITE MODE: Safe data entry and updates
-- ✓ Allowed operations shown below

-- ✓ SELECT: Read data from tables
SELECT * FROM users;

-- ✓ INSERT: Add new records
INSERT INTO users (name, email, status)
VALUES ('Jane Doe', 'jane@example.com', 'active');

-- ✓ UPDATE: Modify existing data
UPDATE users
SET last_login = NOW()
WHERE email = 'jane@example.com';

-- ✓ Bulk operations
INSERT INTO logs (user_id, action)
SELECT id, 'login' FROM users WHERE status = 'active';

-- ✗ BLOCKED: DELETE - Cannot remove records
-- DELETE FROM users WHERE status = 'inactive';

-- ✗ BLOCKED: DROP - Cannot delete tables
-- DROP TABLE old_logs;

-- ✗ BLOCKED: TRUNCATE - Cannot empty tables
-- TRUNCATE TABLE sessions;`,

      full: `-- FULL ACCESS MODE: Complete database control
-- ⚠️  All operations allowed - use with caution!

-- ✓ SELECT: Read data
SELECT * FROM users;

-- ✓ INSERT: Add new records
INSERT INTO users (name, email)
VALUES ('Admin', 'admin@example.com');

-- ✓ UPDATE: Modify existing data
UPDATE users SET role = 'admin' WHERE id = 1;

-- ✓ DELETE: Remove records
DELETE FROM users WHERE last_login < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- ✓ DROP: Delete tables
DROP TABLE IF EXISTS temp_table;

-- ✓ CREATE: Create new tables
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✓ ALTER: Modify table structure
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- ✓ TRUNCATE: Empty tables
TRUNCATE TABLE sessions;`,
    }),
    []
  );

  const addModeRef = (el: HTMLButtonElement | null) => {
    if (el && !modeRefs.current.includes(el)) modeRefs.current.push(el);
  };

  const currentConfig = modeConfig[selectedMode];

  return (
    <section
      id="permission-modes"
      className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-purple-900/30 to-gray-900/50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Permission Modes
          </h2>
          <p className="text-xl text-pink-100 max-w-3xl mx-auto">
            Choose the right level of access for your needs. Switch between
            modes anytime to keep your data safe.
          </p>
        </div>
        <div className="max-w-6xl mx-auto">
          <div
            ref={editorRef}
            className="relative w-full shadow-2xl overflow-hidden bg-[#0f0f23] border-2 border-transparent rounded-2xl"
            style={{
              background:
                "linear-gradient(#0f0f23, #0f0f23) padding-box, linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) border-box",
              boxShadow:
                "0 0 40px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="flex items-center justify-between bg-[#0f0f23] px-4 py-2 border-b border-purple-500/30">
              <div className="flex gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              </div>
              <Input
                type="text"
                value="https://sculptql.com/editor"
                disabled
                className="w-full max-w-sm px-3 py-1 rounded-md bg-[#1e1b4b] text-[#e0e6ed] text-sm font-mono border border-purple-500/30 text-center cursor-default mx-6"
              />
              <div className="w-16" />
            </div>
            <div className="flex items-start bg-[#1e1b4b] border-b border-purple-500/30">
              {(Object.keys(modeConfig) as PermissionMode[]).map((mode) => {
                const config = modeConfig[mode];
                const Icon = config.icon;
                const isActive = mode === selectedMode;

                return (
                  <Button
                    key={mode}
                    ref={addModeRef}
                    onClick={() => setSelectedMode(mode)}
                    className={`flex items-center gap-2 px-4 py-2 font-mono text-sm transition-all ${
                      isActive
                        ? `bg-[#0f0f23] ${config.textColor} border border-b-0 ${config.borderColor}`
                        : "bg-[#1e1b4b] text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{config.label}</span>
                  </Button>
                );
              })}
            </div>
            <CodeMirror
              value={queries[selectedMode]}
              height="500px"
              width="100%"
              extensions={[
                sql(),
                customTheme,
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
              ]}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: false,
                bracketMatching: true,
                closeBrackets: false,
                autocompletion: false,
                highlightSelectionMatches: false,
                searchKeymap: false,
              }}
            />
          </div>
        </div>
        <div className="mt-12 max-w-4xl mx-auto">
          <div
            className={`p-6 rounded-xl ${currentConfig.bgColor} ${currentConfig.borderColor} border-2`}
          >
            <div className="flex items-center gap-3 mb-3">
              <currentConfig.icon
                className={`w-6 h-6 ${currentConfig.textColor}`}
              />
              <h4 className={`text-xl font-bold ${currentConfig.textColor}`}>
                Current Mode: {currentConfig.label}
              </h4>
            </div>
            <p className="text-gray-300 text-base mb-4">
              {currentConfig.description}
            </p>
            <p className="text-cyan-200 text-sm">
              💡 <strong>Pro Tip:</strong> Switch between modes in the editor
              toolbar. Changes apply instantly without restarting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
