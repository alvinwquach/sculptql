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
import TableView from "./TableView";
import ERDView from "./ERDView";

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
  const searchParams = useSearchParams();

  const [tableSearch, setTableSearch] = useState(
    searchParams.get("tableSearch") || initialTableSearch
  );
  const [columnSearch, setColumnSearch] = useState(
    searchParams.get("columnSearch") || initialColumnSearch
  );

  const validViewModes = ["table", "erd"] as const;
  const [viewMode, setViewMode] = useState<"table" | "erd">(
    validViewModes.includes(searchParams.get("view") as any)
      ? (searchParams.get("view") as "table" | "erd")
      : initialViewMode
  );

  const [debouncedTableSearch] = useDebounce(tableSearch, 300);
  const [debouncedColumnSearch] = useDebounce(columnSearch, 300);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tableSearch", tableSearch);
    url.searchParams.set("columnSearch", columnSearch);
    url.searchParams.set("view", viewMode);
    window.history.replaceState({}, "", url);
  }, [tableSearch, columnSearch, viewMode]);

  const filteredSchema = filterSchema(
    initialSchema,
    debouncedTableSearch,
    debouncedColumnSearch
  );

  const handleTabChange = (value: string) => {
    if (validViewModes.includes(value as any)) {
      setViewMode(value as "table" | "erd");
    }
  };

  return (
    <div className="bg-[#0f172a] p-4 sm:p-6">
      {error ? (
        <Card className="bg-red-900/20 border-red-500/30 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-red-300">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-7xl mx-auto">
          <TooltipProvider>
            <Tabs
              value={viewMode}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="bg-slate-800/70 sm:mb-6 grid grid-cols-2 shadow-inner rounded-lg">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="table"
                      className="data-[state=active]:bg-green-400 data-[state=active]:text-[#111827] text-green-400  flex items-center justify-center rounded-md hover:bg-green-500 hover:text-[#111827] transition-all duration-200"
                    >
                      <TableIcon className="w-5 h-5" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-sm">
                    Table View
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="erd"
                      className="data-[state=active]:bg-green-400  data-[state=active]:text-[#111827] text-green-400 flex items-center justify-center rounded-md hover:bg-green-500 hover:text-[#111827] transition-all duration-200"
                    >
                      <Share2Icon className="w-5 h-5" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-sm">
                    ERD View
                  </TooltipContent>
                </Tooltip>
              </TabsList>
              <TabsContent value="table" className="mt-0">
                <TableView
                  schema={filteredSchema}
                  tableSearch={tableSearch}
                  columnSearch={columnSearch}
                  updateUrl={({
                    tableSearch,
                    columnSearch,
                    viewMode,
                  }: {
                    tableSearch: string;
                    columnSearch: string;
                    viewMode: string;
                  }) => {
                    setTableSearch(tableSearch);
                    setColumnSearch(columnSearch);
                    if (validViewModes.includes(viewMode as any)) {
                      setViewMode(viewMode as "table" | "erd");
                    }
                  }}
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
