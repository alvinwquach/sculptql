"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TableIcon, Share2Icon } from "lucide-react";
import { TableSchema } from "@/app/types/query";
import { filterSchema } from "./FilterSchema";
import DatabaseFolderView from "./StructureView";
import ERDView from "./ERDView";
import ERDSkeleton from "./ERDSkeleton";

// Props for the ClientSchemaPage component
interface ClientSchemaPageProps {
  initialSchema: TableSchema[];
  initialTableSearch: string;
  initialColumnSearch: string;
  initialViewMode: "table" | "erd";
  error: string | null;
  loading?: boolean;
}

export default function ClientSchemaPage({
  initialSchema,
  initialTableSearch,
  initialColumnSearch,
  initialViewMode,
  error,
  loading = false,
}: ClientSchemaPageProps) {
  // Create the search params by the use search params
  const searchParams = useSearchParams();
  // Create the table search by the search params and the initial table search
  // by getting the table search from the search params or the initial table search
  const [tableSearch, setTableSearch] = useState(
    searchParams.get("tableSearch") || initialTableSearch
  );
  // Create the column search by the search params and the initial column search
  // by getting the column search from the search params or the initial column search
  const [columnSearch, setColumnSearch] = useState(
    searchParams.get("columnSearch") || initialColumnSearch
  );
  // Create the valid view modes by the table and the erd
  const validViewModes = ["table", "erd"] as const;
  // Type for the view mode
  type ViewMode = (typeof validViewModes)[number];
  // Extract the view param from searchParams
  const initialViewParam = searchParams.get("view");
  // Determine the initial view mode based on valid view modes or the fallback mode
  const initialView = validViewModes.includes(initialViewParam as ViewMode)
    ? (initialViewParam as ViewMode)
    : initialViewMode;
  // Set the view mode state
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  // Create the debounced table search by the table search and the debounce
  const [debouncedTableSearch] = useDebounce(tableSearch, 300);
  // Create the debounced column search by the column search and the debounce
  const [debouncedColumnSearch] = useDebounce(columnSearch, 300);

  useEffect(() => {
    // Create the url by the window location href
    const url = new URL(window.location.href);
    // Set the table search by the url search params and the table search
    url.searchParams.set("tableSearch", tableSearch);
    // Set the column search by the url search params and the column search
    url.searchParams.set("columnSearch", columnSearch);
    // Set the view mode by the url search params and the view mode
    url.searchParams.set("view", viewMode);
    // Replace the window history state and the url
    window.history.replaceState({}, "", url);
  }, [tableSearch, columnSearch, viewMode]);

  // Create the filtered schema by the initial schema and the debounced table search and the debounced column search
  const filteredSchema = filterSchema(
    initialSchema,
    debouncedTableSearch,
    debouncedColumnSearch
  );

  // Function to handle the tab change
  const handleTabChange = (value: string) => {
    // If the valid view modes includes the value
    if (validViewModes.includes(value as ViewMode)) {
      // Set the view mode by the value
      setViewMode(value as ViewMode);
    }
  };

  // Function to handle the update url
  const handleUpdateUrl = (params: {
    tableSearch: string;
    columnSearch: string;
    viewMode: string;
  }) => {
    // Set the table search by the params table search
    setTableSearch(params.tableSearch);
    // Set the column search by the params column search
    setColumnSearch(params.columnSearch);
    // If the valid view modes includes the params view mode
    if (validViewModes.includes(params.viewMode as ViewMode)) {
      // Set the view mode by the params view mode
      setViewMode(params.viewMode as ViewMode);
    }
  };

  return (
    <div className="w-full">
      {error ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl shadow-lg backdrop-blur-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <p className="text-red-300 font-mono">{error}</p>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <TooltipProvider delayDuration={200}>
            <Tabs
              value={viewMode}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-800/50 p-1 text-slate-400 mb-6 shadow-lg border border-purple-500/20 backdrop-blur-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="table"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30 hover:text-cyan-300 hover:bg-slate-700/50"
                    >
                      <TableIcon className="w-4 h-4 mr-2 text-cyan-300" />
                      <span className="font-mono text-cyan-300">STRUCTURE</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-sm bg-slate-800 border-purple-500/50 text-cyan-200 shadow-lg shadow-cyan-500/20 z-[100]"
                  >
                    Browse tables and columns in folder structure
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="erd"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/30 hover:text-pink-300 hover:bg-slate-700/50"
                    >
                      <Share2Icon className="w-4 h-4 mr-2 text-purple-400" />
                      <span className="font-mono text-purple-400">
                        RELATIONSHIPS
                      </span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-sm bg-slate-800 border-purple-500/50 text-pink-200 shadow-lg shadow-pink-500/20 z-[100]"
                  >
                    Visualize table relationships in ERD diagram
                  </TooltipContent>
                </Tooltip>
              </TabsList>
              <TabsContent value="table" className="mt-0 mb-4">
                <DatabaseFolderView
                  schema={filteredSchema}
                  tableSearch={tableSearch}
                  columnSearch={columnSearch}
                  updateUrl={handleUpdateUrl}
                  viewMode={viewMode}
                />
              </TabsContent>
              <TabsContent value="erd" className="mt-0">
                {loading && initialSchema.length === 0 ? (
                  <ERDSkeleton />
                ) : (
                  <ERDView schema={filteredSchema} />
                )}
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
