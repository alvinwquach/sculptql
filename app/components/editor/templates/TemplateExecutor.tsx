"use client";

import { useState } from "react";
import { QueryTemplate, QueryResult } from "@/app/types/query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, X } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import { RUN_TEMPLATE_QUERY } from "@/app/graphql/mutations/runTemplateQuery";

interface RunTemplateQueryData {
  runTemplateQuery: {
    rows: Record<string, unknown>[];
    rowCount: number;
    fields: string[];
    payloadSize: number;
    totalTime: number;
    errorsCount: number;
    error?: string;
  };
}

interface RunTemplateQueryVariables {
  templateQuery: string;
  parameters: Array<{ name: string; value: string }>;
}

interface TemplateExecutorProps {
  template: QueryTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: QueryResult) => void;
}

export default function TemplateExecutor({
  template,
  isOpen,
  onClose,
  onResult,
}: TemplateExecutorProps) {
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [runTemplateQuery, { loading }] = useMutation<
    RunTemplateQueryData,
    RunTemplateQueryVariables
  >(RUN_TEMPLATE_QUERY);

  const handleExecute = async () => {
    if (!template) return;

    for (const param of template.parameters) {
      if (param.required && !paramValues[param.name]) {
        toast.error(`Parameter "${param.name}" is required`);
        return;
      }
    }

    const parameters = template.parameters.map((param) => ({
      name: param.name,
      value: paramValues[param.name] || param.defaultValue?.toString() || "",
    }));

    try {
      const { data } = await runTemplateQuery({
        variables: {
          templateQuery: template.query,
          parameters,
        },
      });

      if (data?.runTemplateQuery?.error) {
        toast.error(data.runTemplateQuery.error);
      } else if (data?.runTemplateQuery) {
        toast.success("Template executed successfully");
        onResult(data.runTemplateQuery);
        onClose();
      }
    } catch (error) {
      console.error("Failed to execute template:", error);
      toast.error("Failed to execute template");
    }
  };

  const handleParamChange = (paramName: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-purple-500/30">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Execute Template: {template.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {template.description && (
            <p className="text-sm text-gray-400 mt-2">{template.description}</p>
          )}
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-3 bg-gray-800/50 border border-purple-500/20 rounded-lg">
            <h3 className="text-sm font-semibold text-purple-300 mb-2">
              Query Template
            </h3>
            <pre className="text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
              {template.query}
            </pre>
          </div>
          {template.parameters.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-purple-300">
                Parameters
              </h3>
              {template.parameters.map((param) => (
                <div key={param.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={param.name}
                      className="text-sm text-gray-300"
                    >
                      {param.name}
                      {param.required && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </Label>
                    <Badge
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-300 text-xs"
                    >
                      {param.type}
                    </Badge>
                  </div>
                  {param.description && (
                    <p className="text-xs text-gray-400">{param.description}</p>
                  )}
                  <Input
                    id={param.name}
                    type={
                      param.type === "number"
                        ? "number"
                        : param.type === "date"
                        ? "date"
                        : "text"
                    }
                    value={paramValues[param.name] || ""}
                    onChange={(e) =>
                      handleParamChange(param.name, e.target.value)
                    }
                    placeholder={
                      param.defaultValue
                        ? `Default: ${param.defaultValue}`
                        : `Enter ${param.name}...`
                    }
                    className="bg-gray-800 border-purple-500/30 text-white"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-purple-500/20">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-purple-500/30 text-gray-300 hover:bg-purple-500/10 hover:text-white hover:border-purple-500/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecute}
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              {loading ? "Executing..." : "Execute Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
