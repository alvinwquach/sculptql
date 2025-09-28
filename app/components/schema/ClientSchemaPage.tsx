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
import DatabaseFolderView from "./TableView";
import ERDView from "./ERDView";

// Props for the ClientSchemaPage component
interface ClientSchemaPageProps {
  initialSchema: TableSchema[];
  initialTableSearch: string;
  initialColumnSearch: string;
  initialViewMode: "table" | "erd";
  error: string | null;
}

export default function ClientSchemaPage({
  initialSchema,
  initialTableSearch,
  initialColumnSearch,
  initialViewMode,
  error,
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
        <Card className="bg-red-900/20 border-red-500/30 shadow-lg backdrop-blur-sm">
          <CardContent className="pt-6">
            <p className="text-red-300">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full">
          <TooltipProvider>
            <Tabs
              value={viewMode}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="bg-slate-800/70 backdrop-blur-sm mb-6 grid grid-cols-2 shadow-inner rounded-lg border border-purple-500/30 bg-gradient-to-r from-slate-800/80 to-slate-700/80">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="table"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-cyan-300 flex items-center justify-center rounded-md hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 hover:text-cyan-200 transition-all duration-200 font-medium border border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20"
                    >
                      <TableIcon className="w-5 h-5 mr-2" />
                      Table View
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-sm bg-slate-800 border-purple-500/50 text-cyan-200">
                    Browse tables in a structured format
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="erd"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-pink-300 flex items-center justify-center rounded-md hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 hover:text-pink-200 transition-all duration-200 font-medium border border-pink-500/30 hover:border-pink-400/50 hover:shadow-lg hover:shadow-pink-500/20"
                    >
                      <Share2Icon className="w-5 h-5 mr-2" />
                      ERD View
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-sm bg-slate-800 border-purple-500/50 text-pink-200">
                    Visualize table relationships
                  </TooltipContent>
                </Tooltip>
              </TabsList>
              <TabsContent value="table" className="mt-0">
                <DatabaseFolderView
                  schema={filteredSchema}
                  tableSearch={tableSearch}
                  columnSearch={columnSearch}
                  updateUrl={handleUpdateUrl}
                  viewMode={viewMode}
                />
              </TabsContent>
              <TabsContent value="erd" className="mt-0">
                <ERDView schema={filteredSchema} />
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
