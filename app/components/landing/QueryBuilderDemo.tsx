"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Database, Table2, Columns, Filter, SortAsc, Group } from "lucide-react";


// Type for the query state

type QueryState = {
  selectedTable: string | null;
  selectedColumns: string[];
  whereConditions: string[];
  orderBy: string | null;
  groupBy: string[];
};

export default function QueryBuilderDemo({ className = "" }: { className?: string }) {
  // State for the active step
  const [activeStep, setActiveStep] = useState(0);

  const [queryState, setQueryState] = useState<QueryState>({
    selectedTable: null,
    selectedColumns: [],
    whereConditions: [],
    orderBy: null,
    groupBy: [],
  });

  // Ref for the container
  const containerRef = useRef<HTMLDivElement>(null);

  // Steps for the query builder
  const steps = [
    {
      title: "Select Table",
      icon: Table2,
      description: "Choose the table to query from",
      action: () => {
        setQueryState(prev => ({ ...prev, selectedTable: "users" }));
        setActiveStep(1);
      }
    },
    {
      title: "Select Columns",
      icon: Columns,
      description: "Pick the columns you want to retrieve",
      action: () => {
        setQueryState(prev => ({
          ...prev,
          selectedColumns: ["user_name", "email", "created_at"]
        }));
        setActiveStep(2);
      }
    },
    {
      title: "Add WHERE Conditions",
      icon: Filter,
      description: "Filter your data with conditions",
      action: () => {
        setQueryState(prev => ({
          ...prev,
          whereConditions: ["active = 'true'"]
        }));
        setActiveStep(3);
      }
    },
    {
      title: "Order Results",
      icon: SortAsc,
      description: "Sort your results by column",
      action: () => {
        setQueryState(prev => ({
          ...prev,
          orderBy: "created_at DESC"
        }));
        setActiveStep(4);
      }
    },
    {
      title: "Group Data",
      icon: Group,
      description: "Group results for aggregation",
      action: () => {
        setQueryState(prev => ({
          ...prev,
          groupBy: ["status"]
        }));
        setActiveStep(5);
      }
    }
  ];

  // Tables for the query builder
  const tables = [
    { name: "users", rows: 1234, description: "User accounts and profiles" },
    { name: "orders", rows: 5678, description: "Customer orders and transactions" },
    { name: "products", rows: 890, description: "Product catalog and inventory" },
    { name: "categories", rows: 45, description: "Product categories and classifications" }
  ];

  // Columns for the query builder
  const columns = queryState.selectedTable ? [
    { name: "user_name", type: "VARCHAR(255)", description: "User's display name" },
    { name: "email", type: "VARCHAR(255)", description: "User's email address" },
    { name: "created_at", type: "TIMESTAMP", description: "Account creation date" },
    { name: "status", type: "VARCHAR(50)", description: "Account status" },
    { name: "last_login", type: "TIMESTAMP", description: "Last login timestamp" }
  ] : [];


  useEffect(() => {
    // If the container ref is not found, return
    if (containerRef.current) {
      // Animate the container
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  // Function to generate the query
  const generateQuery = () => {
    // Get the query state
    const { selectedColumns, selectedTable, whereConditions, groupBy, orderBy } = queryState;
    // Initialize the query
    let query = "SELECT ";
    // If the selected columns are not empty, add the selected columns to the query
    query += selectedColumns.length > 0 ? selectedColumns.join(", ") : "*";
    // If the selected table is not empty, add the selected table to the query
    if (selectedTable) query += `\nFROM ${selectedTable}`;
    // If the where conditions are not empty, add the where conditions to the query
    if (whereConditions.length > 0) query += `\nWHERE ${whereConditions.join(" AND ")}`;
    // If the group by are not empty, add the group by to the query
    if (groupBy.length > 0) query += `\nGROUP BY ${groupBy.join(", ")}`;
    // If the order by is not empty, add the order by to the query
    if (orderBy) query += `\nORDER BY ${orderBy}`;
    // Add the semicolon to the query
    query += ";";
    // Return the query
    return query;
  };

  return (
    <div
      ref={containerRef}
      className={`bg-gradient-to-br from-gray-900 to-purple-900 rounded-xl p-8 border border-pink-500/30 ${className}`}
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-pink-400 mb-2">Visual Query Builder</h3>
        <p className="text-pink-200">Build SQL queries with point-and-click interface</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                index <= activeStep
                  ? "bg-pink-500/20 border-pink-400/50 text-pink-300"
                  : "bg-gray-800/50 border-gray-600/50 text-gray-400"
              }`}
              onClick={step.action}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  index <= activeStep ? "bg-pink-500/30" : "bg-gray-700/50"
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold">{step.title}</h4>
                  <p className="text-sm opacity-80">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-cyan-400" />
            <h4 className="text-cyan-400 font-semibold">Generated Query</h4>
          </div>
          <pre className="text-pink-200 text-sm font-mono whitespace-pre-wrap">
            {generateQuery()}
          </pre>
        </div>
      </div>
      {activeStep >= 0 && (
        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600/30">
          <h4 className="text-pink-300 font-semibold mb-3">Available Tables</h4>
          <div className="grid grid-cols-2 gap-3">
            {tables.map((table, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  queryState.selectedTable === table.name
                    ? "bg-pink-500/20 border-pink-400/50"
                    : "bg-gray-700/30 border-gray-600/30 hover:border-pink-400/30"
                }`}
                onClick={() =>
                  setQueryState(prev => ({ ...prev, selectedTable: table.name }))
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <Table2 className="w-4 h-4 text-pink-400" />
                  <span className="text-pink-300 font-medium">{table.name}</span>
                </div>
                <p className="text-xs text-gray-400">{table.rows.toLocaleString()} rows</p>
                <p className="text-xs text-gray-500 mt-1">{table.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeStep >= 1 && queryState.selectedTable && (
        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600/30">
          <h4 className="text-pink-300 font-semibold mb-3">Available Columns</h4>
          <div className="space-y-2">
            {columns.map((column, index) => (
              <div
                key={index}
                className={`p-2 rounded border cursor-pointer transition-all ${
                  queryState.selectedColumns.includes(column.name)
                    ? "bg-pink-500/20 border-pink-400/50"
                    : "bg-gray-700/30 border-gray-600/30 hover:border-pink-400/30"
                }`}
                onClick={() => {
                  setQueryState(prev => {
                    const alreadySelected = prev.selectedColumns.includes(column.name);
                    return {
                      ...prev,
                      selectedColumns: alreadySelected
                        ? prev.selectedColumns.filter(col => col !== column.name)
                        : [...prev.selectedColumns, column.name]
                    };
                  });
                }}
              >
                <div className="flex items-center gap-2">
                  <Columns className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-300 font-medium">{column.name}</span>
                  <span className="text-xs text-gray-400">({column.type})</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{column.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

