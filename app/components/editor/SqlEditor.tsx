"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Database, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditorPane from "./EditorPane";
import ResultsPane from "./ResultsPane";
import QueryHistory from "../history/QueryHistory";
import {
  QueryResult,
  ViewMode,
  ChartDataItem,
  TableSchema,
  TableDescription,
  TableColumn,
  Tab,
  QueryHistoryItem,
} from "../../types/query";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "../../utils/localStorageUtils";
import { useSqlCompletion } from "@/app/hooks/useSqlCompletion";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";

export default function SqlEditor() {
  const [queryTabs, setQueryTabs] = useState<Tab[]>([
    { id: 1, title: "Query 1", query: "" },
  ]);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [metadataLoading, setMetadataLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<QueryResult | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [table, setTable] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableDescription, setTableDescription] =
    useState<TableDescription | null>(null);
  const [fullScreenEditor, setFullScreenEditor] = useState<boolean>(false);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn>({});

  useEffect(() => {
    const savedTabs = getLocalStorageItem<Tab[]>("queryTabs", [
      { id: 1, title: "Query 1", query: "" },
    ]);
    setQueryTabs(savedTabs);
    const activeTabId = getLocalStorageItem<number>("activeTab", 1);
    setActiveTab(activeTabId);
  }, []);

  useEffect(() => {
    setLocalStorageItem("queryTabs", queryTabs);
    setLocalStorageItem("activeTab", activeTab);
  }, [queryTabs, activeTab]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "t") {
        event.preventDefault();
        addTab();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queryTabs]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setFullScreenEditor((prev) => !prev);
  }, []);

  const loadHistory = useCallback(() => {
    const stored = getLocalStorageItem<QueryHistoryItem[]>(
      "sculptql_history",
      []
    );
    setHistory(stored);
  }, []);

  const saveQueryToHistory = useCallback(
    (q: string) => {
      const newItem: QueryHistoryItem = {
        query: q,
        timestamp: new Date().toISOString(),
      };
      const updated = [newItem, ...history].slice(0, 200);
      setHistory(updated);
      setLocalStorageItem("sculptql_history", updated);
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    removeLocalStorageItem("sculptql_history");
  }, []);

  const loadQueryFromHistory = useCallback(
    (q: string) => {
      setQueryTabs(
        queryTabs.map((tab) =>
          tab.id === activeTab ? { ...tab, query: q } : tab
        )
      );
    },
    [queryTabs, activeTab]
  );

  const runQueryFromHistory = useCallback(
    (q: string) => {
      loadQueryFromHistory(q);
      setShowHistory(false);
      runQuery();
    },
    [loadQueryFromHistory]
  );

  const fetchTableDescription = useCallback(async (tableName: string) => {
    try {
      const res = await fetch(`/api/describe-table?table=${tableName}`);
      const data = await res.json();
      if (res.ok) {
        setTableDescription(data);
        return data as TableDescription;
      } else {
        setError(data.error || "Failed to fetch table description");
        setTableDescription(null);
        return null;
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
      setTableDescription(null);
      return null;
    }
  }, []);

  const fetchTables = useCallback(async (tableName: string) => {
    if (!tableName) return;
    try {
      const res = await fetch(`/api/show-table?table=${tableName}`);
      const data = await res.json();
      if (res.ok) {
        setTable(data.tables);
      } else {
        setError(data.error || "Failed to fetch table metadata");
        setTable([]);
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
      setTable([]);
    }
  }, []);

  const fetchTableNames = useCallback(async () => {
    setMetadataLoading(true);
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      if (res.ok) {
        const newTableNames = data.tables as string[];
        setTableNames((prev) =>
          JSON.stringify(prev) === JSON.stringify(newTableNames)
            ? prev
            : newTableNames
        );
        await Promise.all(
          newTableNames.map((tableName) => fetchColumns(tableName))
        );
        return newTableNames;
      } else {
        console.error("Failed to fetch table names:", data.error);
        setError(data.error || "Failed to fetch table names");
        return [];
      }
    } catch (e: unknown) {
      console.error("Error fetching table names:", (e as Error).message);
      setError((e as Error).message || "Network error");
      return [];
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  const fetchColumns = useCallback(
    async (tableName: string) => {
      if (!tableName || tableColumns[tableName]) return;
      try {
        const res = await fetch(`/api/columns?table=${tableName}`);
        const data = await res.json();
        if (res.ok) {
          setTableColumns((prev) => ({
            ...prev,
            [tableName]: data.columns,
          }));
        } else {
          console.error(
            "Failed to fetch columns for",
            tableName,
            ":",
            data.error
          );
          setError(data.error || `Failed to fetch columns for ${tableName}`);
        }
      } catch (e: unknown) {
        console.error(
          "Error fetching columns for",
          tableName,
          ":",
          (e as Error).message
        );
        setError((e as Error).message || "Network error");
      }
    },
    [tableColumns]
  );

  const runQuery = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    setTableDescription(null);
    setTable([]);
    setSelectedTable("");

    const currentTab = queryTabs.find((tab) => tab.id === activeTab);
    const currentQuery = currentTab?.query || "";
    if (!currentQuery.trim()) {
      setError("Query cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentQuery }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResult(data as QueryResult);
        saveQueryToHistory(currentQuery);
        const match = currentQuery.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        if (match && match[1]) {
          const tableName = match[1].toLowerCase();
          setSelectedTable(tableName);
          await Promise.all([
            fetchTables(tableName),
            fetchTableDescription(tableName),
            fetchColumns(tableName),
          ]);
        }
        setQueryTabs(
          queryTabs.map((tab) =>
            tab.id === activeTab ? { ...tab, query: "" } : tab
          )
        );
        setViewMode("table");
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [
    queryTabs,
    activeTab,
    saveQueryToHistory,
    fetchTables,
    fetchTableDescription,
    fetchColumns,
  ]);

  const exportToCsv = useCallback(() => {
    if (!result || !result.rows || !result.fields) return;
    const headers = result.fields.join(",");
    const rows = result.rows.map((row) =>
      result.fields
        .map((field) => {
          const value = row[field] !== null ? String(row[field]) : "";
          if (value.includes(",") || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `query_results_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  const exportToJson = useCallback(() => {
    if (!result || !result.rows) return;
    const jsonContent = JSON.stringify(result.rows, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `query_results_${new Date().toISOString()}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  const addTab = useCallback(() => {
    if (queryTabs.length >= 5) {
      alert("Maximum tab limit (5) reached.");
      return;
    }
    const newId = Math.max(...queryTabs.map((tab) => tab.id)) + 1;
    const newTab = { id: newId, title: `Query ${newId}`, query: "" };
    setQueryTabs([...queryTabs, newTab]);
    setActiveTab(newId);
  }, [queryTabs]);

  const handleTabClick = useCallback((id: number) => {
    setActiveTab(id);
  }, []);

  const handleTabClose = useCallback(
    (id: number) => {
      if (id === 1) return;
      const newTabs = queryTabs.filter((tab) => tab.id !== id);
      setQueryTabs(newTabs);
      if (activeTab === id) {
        setActiveTab(newTabs[0]?.id || 1);
      }
    },
    [queryTabs, activeTab]
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      setQueryTabs(
        queryTabs.map((tab) => (tab.id === activeTab ? { ...tab, query } : tab))
      );
    },
    [queryTabs, activeTab]
  );

  const completion = useSqlCompletion(
    tableNames,
    tableColumns,
    stripQuotes,
    needsQuotes
  );

  useEffect(() => {
    loadHistory();
    fetchTableNames();
  }, [loadHistory, fetchTableNames]);

  const chartData: ChartDataItem[] = useMemo(
    () =>
      result
        ? [
            { name: "Parsing", value: result.parsingTime ?? 0, unit: "ms" },
            { name: "Execution", value: result.executionTime ?? 0, unit: "ms" },
            { name: "Response", value: result.responseTime ?? 0, unit: "ms" },
            {
              name: "Locks Wait",
              value: result.locksWaitTime ?? 0,
              unit: "ms",
            },
          ]
        : [],
    [result]
  );

  return (
    <div
      className={`flex flex-col bg-[#0f172a] text-white ${
        fullScreenEditor ? "fixed inset-0 z-50" : "h-screen"
      }`}
    >
      {metadataLoading && (
        <div className="flex items-center justify-center h-full text-gray-400 animate-pulse">
          <Loader2 className="w-12 h-12 mb-4 animate-spin text-green-400" />
          <p className="text-lg">Loading metadata...</p>
        </div>
      )}
      {!metadataLoading && (
        <>
          <div className="flex flex-wrap justify-between items-center gap-4 px-4 pt-12 pb-6 border-b border-slate-700 bg-[#0f172a] shadow-sm">
            <div className="flex items-center space-x-3 min-w-[150px]">
              <Database className="w-6 h-6 text-green-400" />
              <h1 className="text-xl font-mono font-bold tracking-wide text-green-300 whitespace-nowrap">
                SculptQL
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory((prev) => !prev)}
                  className={`px-3 py-1 rounded-lg transition-all duration-300 ease-in-out border-2 shadow-sm ${
                    showHistory
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-md"
                      : "text-white bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white"
                  }`}
                >
                  <History className="w-4 h-4 mr-2" />
                  {showHistory ? "Hide History" : "Show History"}
                </Button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow transition-opacity duration-150 whitespace-nowrap">
                  Show/Hide History
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
                </div>
              </div>
              <div className="relative group">
                <Button
                  onClick={addTab}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold rounded-lg transition duration-200 shadow-sm min-w-[100px]"
                  title="New Tab (Ctrl+T)"
                >
                  New Tab
                </Button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow transition-opacity duration-150 whitespace-nowrap">
                  Ctrl+T
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
                </div>
              </div>
              <div className="relative group">
                <Button
                  onClick={runQuery}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold rounded-lg transition duration-200 shadow-sm min-w-[100px]"
                  title="Run Query (Cmd+Enter / Ctrl+Enter)"
                >
                  Run
                </Button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow transition-opacity duration-150 whitespace-nowrap">
                  {navigator.platform.includes("Mac")
                    ? "⌘+Enter"
                    : "Ctrl+Enter"}
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
                </div>
              </div>
            </div>
          </div>
          <div
            className={`flex flex-1 flex-col lg:flex-row overflow-hidden ${
              fullScreenEditor ? "h-full" : ""
            }`}
          >
            <div className="flex flex-1 min-w-0">
              <QueryHistory
                showHistory={showHistory}
                history={history}
                clearHistory={clearHistory}
                loadQueryFromHistory={loadQueryFromHistory}
                runQueryFromHistory={runQueryFromHistory}
              />
              <EditorPane
                queryTabs={queryTabs}
                activeTab={activeTab}
                fullScreenEditor={fullScreenEditor}
                onToggleFullscreen={toggleFullscreen}
                onTabClick={handleTabClick}
                onTabClose={handleTabClose}
                onQueryChange={handleQueryChange}
                completion={completion}
                metadataLoading={metadataLoading}
                runQuery={runQuery}
              />
            </div>
            <div
              className={`flex flex-1 lg:w-1/2 p-4 overflow-auto ${
                fullScreenEditor ? "hidden" : "h-1/2 lg:h-full"
              } space-y-4 sm:space-y-6`}
            >
              <ResultsPane
                error={error}
                loading={loading}
                result={result}
                viewMode={viewMode}
                selectedTable={selectedTable}
                table={table}
                tableDescription={tableDescription}
                chartData={chartData}
                onViewModeChange={handleViewModeChange}
                onExportToCsv={exportToCsv}
                onExportToJson={exportToJson}
                fullScreenEditor={fullScreenEditor}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}