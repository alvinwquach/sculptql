"use client";

import { useState } from "react";
import { QueryTemplate } from "@/app/types/query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, Edit, Play, Copy, Tag } from "lucide-react";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
import { unifiedCache } from "@/app/utils/unifiedCache";

const TemplateEditor = dynamic(() => import("./TemplateEditor"), {
  ssr: false,
});

interface TemplateManagerProps {
  onSelectTemplate: (template: QueryTemplate) => void;
  onExecuteTemplate: (template: QueryTemplate) => void;
}

export default function TemplateManager({
  onSelectTemplate,
  onExecuteTemplate,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<QueryTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QueryTemplate | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await unifiedCache.getTemplates();
      setTemplates(data || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async () => {
    setIsOpen(true);
    await loadTemplates();
  };

  const handleDelete = async (templateId: string) => {
    try {
      await unifiedCache.deleteTemplate(templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));
      toast.success("Template deleted successfully");
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleUseTemplate = (template: QueryTemplate) => {
    onSelectTemplate(template);
    setIsOpen(false);
    toast.success(`Template "${template.name}" loaded`);
  };

  const handleExecute = (template: QueryTemplate) => {
    onExecuteTemplate(template);
    setIsOpen(false);
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenDialog}
        className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 text-xs font-semibold"
      >
        <FileText className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Templates</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-gray-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Query Templates
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-800 border-purple-500/30 text-white"
          />
          <Button
            onClick={() => {
              setEditingTemplate(null);
              setIsEditing(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-12 h-12 mx-auto mb-3 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p>Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No templates found</p>
              <p className="text-sm mt-2">
                Create your first template to get started
              </p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 bg-gray-800/50 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-purple-300">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-400 mt-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExecute(template)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setIsEditing(true);
                      }}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs">
                  {template.parameters.length > 0 && (
                    <Badge
                      variant="outline"
                      className="border-purple-500/30 text-purple-300"
                    >
                      {template.parameters.length} parameter
                      {template.parameters.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {template.dialect && (
                    <Badge
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-300"
                    >
                      {template.dialect}
                    </Badge>
                  )}
                  {template.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-pink-500/30 text-pink-300"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-gray-900/50 rounded font-mono text-xs text-gray-300 overflow-x-auto">
                  {template.query.substring(0, 150)}
                  {template.query.length > 150 && "..."}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
      </Dialog>
      <TemplateEditor
        key={editingTemplate?.id || 'new'}
        template={editingTemplate}
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditingTemplate(null);
        }}
        onSave={async () => {
          await loadTemplates();
        }}
      />
    </>
  );
}
