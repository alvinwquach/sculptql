"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Database, History, Play, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditorPane from "./EditorPane";
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
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
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
  const [pinnedQueries, setPinnedQueries] = useState<PinnedQuery[]>([]);
  const [bookmarkedQueries, setBookmarkedQueries] = useState<BookmarkedQuery[]>(
    []
  );
  const [labeledQueries, setLabeledQueries] = useState<LabeledQuery[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [table, setTable] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableDescription, setTableDescription] =
    useState<TableDescription | null>(null);
  const [fullScreenEditor, setFullScreenEditor] = useState<boolean>(false);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  useEffect(() => {
    const savedTabs = getLocalStorageItem<Tab[]>("queryTabs", [
      { id: 1, title: "Query 1", query: "" },
    ]);
    setQueryTabs(savedTabs);
    const activeTabId = getLocalStorageItem<number>("activeTab", 1);
    setActiveTab(activeTabId);
    loadHistory();
    loadPinnedQueries();
    loadBookmarkedQueries();
    loadLabeledQueries();
  }, []);

  useEffect(() => {
    setLocalStorageItem("queryTabs", queryTabs);
    setLocalStorageItem("activeTab", activeTab);
    setLocalStorageItem("sculptql_history", history);
    setLocalStorageItem("pinnedQueries", pinnedQueries);
    setLocalStorageItem("bookmarkedQueries", bookmarkedQueries);
    setLocalStorageItem("labeledQueries", labeledQueries);
  }, [
    queryTabs,
    activeTab,
    history,
    pinnedQueries,
    bookmarkedQueries,
    labeledQueries,
  ]);

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
    setCurrentPage(1);
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

  const loadPinnedQueries = useCallback(() => {
    const stored = getLocalStorageItem<PinnedQuery[]>("pinnedQueries", []);
    setPinnedQueries(stored);
  }, []);

  const loadBookmarkedQueries = useCallback(() => {
    const stored = getLocalStorageItem<BookmarkedQuery[]>(
      "bookmarkedQueries",
      []
    );
    setBookmarkedQueries(stored);
  }, []);

  const loadLabeledQueries = useCallback(() => {
    const stored = getLocalStorageItem<LabeledQuery[]>("labeledQueries", []);
    setLabeledQueries(stored);
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

  const addPinnedQuery = useCallback((q: string) => {
    const newItem: PinnedQuery = {
      query: q,
      timestamp: new Date().toISOString(),
    };
    setPinnedQueries([newItem]);
    setLocalStorageItem("pinnedQueries", [newItem]);
  }, []);

  const removePinnedQuery = useCallback((q: string) => {
    setPinnedQueries([]);
    setLocalStorageItem("pinnedQueries", []);
  }, []);

  const addBookmarkedQuery = useCallback(
    (q: string) => {
      const newItem: BookmarkedQuery = {
        query: q,
        timestamp: new Date().toISOString(),
      };
      const updated = [newItem, ...bookmarkedQueries].slice(0, 200);
      setBookmarkedQueries(updated);
      setLocalStorageItem("bookmarkedQueries", updated);
    },
    [bookmarkedQueries]
  );

  const removeBookmarkedQuery = useCallback(
    (q: string) => {
      const updated = bookmarkedQueries.filter((item) => item.query !== q);
      setBookmarkedQueries(updated);
      setLocalStorageItem("bookmarkedQueries", updated);
    },
    [bookmarkedQueries]
  );

  const addLabeledQuery = useCallback(
    (label: string, q: string) => {
      const newItem: LabeledQuery = {
        label,
        query: q,
        timestamp: new Date().toISOString(),
      };
      const updated = [newItem, ...labeledQueries].slice(0, 200);
      setLabeledQueries(updated);
      setLocalStorageItem("labeledQueries", updated);
    },
    [labeledQueries]
  );

  const removeLabeledQuery = useCallback(
    (q: string) => {
      const updated = labeledQueries.filter((item) => item.query !== q);
      setLabeledQueries(updated);
      setLocalStorageItem("labeledQueries", updated);
    },
    [labeledQueries]
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
    setCurrentPage(1);

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

  const exportToCsv = useCallback(
    (exportAll: boolean = false, startIndex: number, endIndex: number) => {
      if (!result || !result.rows || !result.fields) return;
      const headers = result.fields.join(",");
      const rows = result.rows
        .slice(
          exportAll ? 0 : startIndex,
          exportAll ? result.rows.length : endIndex
        )
        .map((row) =>
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
    },
    [result]
  );

  const exportToJson = useCallback(
    (exportAll: boolean = false, startIndex: number, endIndex: number) => {
      if (!result || !result.rows) return;
      const jsonContent = JSON.stringify(
        result.rows.slice(
          exportAll ? 0 : startIndex,
          exportAll ? result.rows.length : endIndex
        ),
        null,
        2
      );
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
    },
    [result]
  );

  const exportToMarkdown = useCallback(
    (exportAll: boolean = false, startIndex: number, endIndex: number) => {
      if (!result || !result.rows || !result.fields) return;
      const headers =
        result.fields.map((field) => `| ${field} `).join("") + "|";
      const separator = result.fields.map(() => "| --- ").join("") + "|";
      const rows = result.rows
        .slice(
          exportAll ? 0 : startIndex,
          exportAll ? result.rows.length : endIndex
        )
        .map(
          (row) =>
            result.fields
              .map((field) => {
                const value = row[field] !== null ? String(row[field]) : "";
                return `| ${value.replace(/\|/g, "\\|")} `;
              })
              .join("") + "|"
        );
      const markdownContent = [headers, separator, ...rows].join("\n");
      const blob = new Blob([markdownContent], {
        type: "text/markdown;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `query_results_${new Date().toISOString()}.md`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [result]
  );

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
  const handleTabReorder = useCallback((newTabs: Tab[]) => {
    setQueryTabs(newTabs);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      const totalRows = result?.rows?.length || 0;
      const totalPages = Math.ceil(totalRows / pageSize);
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [result, pageSize]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const completion = useSqlCompletion(
    tableNames,
    tableColumns,
    stripQuotes,
    needsQuotes
  );

  const resultChartData: ChartDataItem[] = useMemo(() => {
    if (!result || !result.rows || !result.fields) return [];

    const numericalColumns = result.fields.filter((field) =>
      result.rows.every((row) => typeof row[field] === "number")
    );

    const categoricalColumns = result.fields.filter(
      (field) => !numericalColumns.includes(field)
    );

    if (categoricalColumns.length > 0 && numericalColumns.length > 0) {
      const categoryField = categoricalColumns[0];
      const valueField = numericalColumns[0];

      const groupedData = result.rows.reduce(
        (acc: Record<string, number>, row) => {
          const category = String(row[categoryField]);
          const value = Number(row[valueField]) || 0;
          acc[category] = (acc[category] ?? 0) + value;
          return acc;
        },
        {}
      );

      return Object.entries(groupedData).map(([name, value]) => ({
        name,
        value,
        unit: "count",
      }));
    }

    if (categoricalColumns.length > 0) {
      const categoryField = categoricalColumns[0];

      const counts = result.rows.reduce((acc: Record<string, number>, row) => {
        const category = String(row[categoryField]);
        acc[category] = (acc[category] ?? 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        unit: "count",
      }));
    }

    return [];
  }, [result]);

  const statsChartData: ChartDataItem[] = useMemo(
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

  useEffect(() => {
    loadHistory();
    fetchTableNames();
  }, [loadHistory, fetchTableNames]);

  return (
    <div
      className={`flex flex-col bg-[#0f172a] text-white ${
        fullScreenEditor ? "fixed inset-0 z-50" : "h-screen"
      }`}
    >
      {metadataLoading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
          <Loader2 className="w-12 h-12 mb-4 animate-spin text-green-400" />
          <p className="text-lg">Loading metadata...</p>
        </div>
      )}
      {!metadataLoading && (
        <>
          <div className="flex justify-between items-center gap-4 px-4 sm:px-6 pt-12 pb-6 border-b border-slate-700 bg-[#0f172a] shadow-sm max-w-full">
            <div className="flex items-center space-x-3 min-w-[120px]">
              <Database className="w-5 h-5 text-green-400" />
              <h1 className="text-xl font-mono font-bold tracking-wide text-green-300 whitespace-nowrap">
                SculptQL
              </h1>
            </div>
            <div className="flex items-center space-x-2 ml-[-8px] sm:ml-0">
              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg transition-all duration-300 ease-in-out border-2 shadow-sm ${
                    showHistory
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-md hover:text-white"
                      : "text-white bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white"
                  }`}
                >
                  <History className="w-4 h-4 mr-1" />
                  {showHistory ? "Hide History" : "Show History"}
                </Button>
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow whitespace-nowrap">
                  Show/Hide History
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
                </div>
              </div>
              <div className="relative group">
                <Button
                  onClick={addTab}
                  className="px-2.5 py-1 rounded-lg transition-all duration-300 ease-in-out border-2 shadow-sm text-white bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white flex items-center justify-center gap-1"
                  title="New Tab (Ctrl+T)"
                >
                  <PlusSquare className="w-4 h-4" />
                  Tab
                </Button>
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow whitespace-nowrap">
                  Ctrl+T
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
                </div>
              </div>
              <div className="relative group">
                <Button
                  onClick={runQuery}
                  className="px-2.5 py-1 rounded-3xl transition-all duration-300 ease-in-out border-2 shadow-sm text-white bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white flex items-center justify-center gap-1"
                  title="Run Query (Cmd+Enter / Ctrl+Enter)"
                >
                  <Play className="w-4 h-4" />
                  Run
                </Button>
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow whitespace-nowrap">
                  {navigator.platform.includes("Mac")
                    ? "⌘+Enter"
                    : "Ctrl+Enter"}
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
                </div>
              </div>
            </div>
          </div>
          <div
            className={`flex flex-1 w-full min-w-0 overflow-hidden ${
              fullScreenEditor ? "h-full" : ""
            }`}
          >
            <QueryHistory
              showHistory={showHistory}
              history={history}
              pinnedQueries={pinnedQueries}
              bookmarkedQueries={bookmarkedQueries}
              labeledQueries={labeledQueries}
              clearHistory={clearHistory}
              loadQueryFromHistory={loadQueryFromHistory}
              runQueryFromHistory={runQueryFromHistory}
              addPinnedQuery={addPinnedQuery}
              removePinnedQuery={removePinnedQuery}
              addBookmarkedQuery={addBookmarkedQuery}
              removeBookmarkedQuery={removeBookmarkedQuery}
              addLabeledQuery={addLabeledQuery}
              removeLabeledQuery={removeLabeledQuery}
            />
            <EditorPane
              queryTabs={queryTabs}
              activeTab={activeTab}
              fullScreenEditor={fullScreenEditor}
              onToggleFullscreen={toggleFullscreen}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
              onQueryChange={handleQueryChange}
              onTabReorder={handleTabReorder}
              completion={completion}
              metadataLoading={metadataLoading}
              runQuery={runQuery}
              tableNames={tableNames}
              tableColumns={tableColumns}
              error={error}
              loading={loading}
              result={result}
              viewMode={viewMode}
              selectedTable={selectedTable}
              table={table}
              tableDescription={tableDescription}
              chartData={statsChartData}
              resultChartData={resultChartData}
              onViewModeChange={handleViewModeChange}
              onExportToCsv={exportToCsv}
              onExportToJson={exportToJson}
              onExportToMarkdown={exportToMarkdown}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </>
      )}
    </div>
  );
}