"use client";

import { useState, useMemo } from "react";
import { QueryTemplate, TemplateParameter } from "@/app/types/query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  extractParametersFromTemplate,
  validateTemplateSyntax,
} from "@/app/utils/templateParser";
import { unifiedCache } from "@/app/utils/unifiedCache";

interface TemplateEditorProps {
  template: QueryTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function TemplateEditor({
  template,
  isOpen,
  onClose,
  onSave,
}: TemplateEditorProps) {
  const [formData, setFormData] = useState(() => ({
    name: template?.name || "",
    description: template?.description || "",
    query: template?.query || "",
    dialect: template?.dialect || "",
    tags: template?.tags || [],
  }));
  const [parameterConfigs, setParameterConfigs] = useState<TemplateParameter[]>(
    () => template?.parameters || []
  );
  const [tagInput, setTagInput] = useState("");

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const detectedParams = useMemo(
    () => (formData.query ? extractParametersFromTemplate(formData.query) : []),
    [formData.query]
  );

  const parameters = useMemo(() => {
    if (!detectedParams.length) return [];

    const existingParamsMap = new Map(parameterConfigs.map((p) => [p.name, p]));

    return detectedParams.map(
      (name) =>
        existingParamsMap.get(name) || {
          name,
          type: "string" as const,
          required: true,
        }
    );
  }, [detectedParams, parameterConfigs]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!formData.query.trim()) {
      toast.error("Query is required");
      return;
    }

    const validation = validateTemplateSyntax(formData.query);
    if (!validation.valid) {
      toast.error(`Template syntax errors: ${validation.errors.join(", ")}`);
      return;
    }

    const now = new Date().toISOString();
    const templateData: QueryTemplate = template
      ? {
          ...template,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          query: formData.query.trim(),
          dialect: formData.dialect.trim() || undefined,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          parameters,
          updatedAt: now,
        }
      : {
          id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          query: formData.query.trim(),
          dialect: formData.dialect.trim() || undefined,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          parameters,
          createdAt: now,
          updatedAt: now,
        };

    try {
      await unifiedCache.saveTemplate(templateData);
      toast.success(
        `Template ${template ? "updated" : "created"} successfully`
      );
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    updateField(
      "tags",
      formData.tags.filter((t) => t !== tag)
    );
  };

  const updateParameter = (
    index: number,
    field: keyof TemplateParameter,
    value: TemplateParameter[keyof TemplateParameter]
  ) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameterConfigs(updated);
  };

  const removeParameter = (index: number) => {
    setParameterConfigs(parameters.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {template ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-purple-300">
              Template Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., User by ID"
              className="bg-gray-800 border-purple-500/30 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-purple-300">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Optional description of what this template does"
              className="bg-gray-800 border-purple-500/30 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="query" className="text-sm text-purple-300">
              Query Template <span className="text-red-400">*</span>
            </Label>
            <p className="text-xs text-gray-400">
              Use {`{{paramName}}`} for parameters
            </p>
            <Textarea
              id="query"
              value={formData.query}
              onChange={(e) => updateField("query", e.target.value)}
              placeholder={`SELECT * FROM users WHERE id = {{userId}}`}
              className="w-full h-32 p-3 bg-gray-800 border border-purple-500/30 rounded-md text-white font-mono text-sm"
            />
            {detectedParams.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <span className="text-xs text-gray-400">
                  Detected parameters:
                </span>
                {detectedParams.map((param) => (
                  <Badge
                    key={param}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-300 text-xs"
                  >
                    {param}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialect" className="text-sm text-purple-300">
              Dialect (Optional)
            </Label>
            <Input
              id="dialect"
              value={formData.dialect}
              onChange={(e) => updateField("dialect", e.target.value)}
              placeholder="e.g., postgres, mysql"
              className="bg-gray-800 border-purple-500/30 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-purple-300">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag..."
                className="bg-gray-800 border-purple-500/30 text-white"
              />
              <Button
                type="button"
                onClick={addTag}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-pink-500/30 text-pink-300"
                  >
                    {tag}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {parameters.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm text-purple-300">Parameters</Label>
              {parameters.map((param, index) => (
                <div
                  key={param.name}
                  className="p-3 bg-gray-800/50 border border-purple-500/20 rounded space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-300">
                      {param.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParameter(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-400">Type</Label>
                      <select
                        value={param.type}
                        onChange={(e) =>
                          updateParameter(
                            index,
                            "type",
                            e.target.value as TemplateParameter["type"]
                          )
                        }
                        className="w-full mt-1 p-2 bg-gray-700 border border-purple-500/30 rounded text-sm text-white"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">
                        Default Value
                      </Label>
                      <Input
                        value={param.defaultValue?.toString() || ""}
                        onChange={(e) =>
                          updateParameter(index, "defaultValue", e.target.value)
                        }
                        placeholder="Optional"
                        className="mt-1 bg-gray-700 border-purple-500/30 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Description</Label>
                    <Input
                      value={param.description || ""}
                      onChange={(e) =>
                        updateParameter(index, "description", e.target.value)
                      }
                      placeholder="Optional parameter description"
                      className="mt-1 bg-gray-700 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={param.required || false}
                      onChange={(e) =>
                        updateParameter(index, "required", e.target.checked)
                      }
                      className="rounded"
                    />
                    <Label
                      htmlFor={`required-${index}`}
                      className="text-xs text-gray-400"
                    >
                      Required
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-purple-500/20">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-gray-900 border-purple-500/30  text-black border-purple-500/30 text-gray-300 hover:bg-purple-500/10 hover:text-white hover:border-purple-500/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
