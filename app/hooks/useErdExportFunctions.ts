"use client";

import { useCallback } from "react";
import { TableSchema } from "@/app/types/query";

export interface ErdExportFunctions {
  exportToSvg: () => void;
  exportToPng: () => void;
  exportToJpeg: () => void;
  exportToJson: () => void;
}

export function useErdExportFunctions(
  svgRef: React.RefObject<SVGSVGElement | null>,
  schema: TableSchema[]
): ErdExportFunctions {
  const exportToSvg = useCallback(() => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `erd-diagram-${new Date().toISOString().split("T")[0]}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  }, [svgRef]);

  const exportToPng = useCallback(() => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = svgElement.viewBox.baseVal.width || svgElement.clientWidth;
      canvas.height = svgElement.viewBox.baseVal.height || svgElement.clientHeight;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `erd-diagram-${new Date().toISOString().split("T")[0]}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(pngUrl);
      }, "image/png");

      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [svgRef]);

  const exportToJpeg = useCallback(() => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = svgElement.viewBox.baseVal.width || svgElement.clientWidth;
      canvas.height = svgElement.viewBox.baseVal.height || svgElement.clientHeight;

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const jpegUrl = URL.createObjectURL(blob);
          const downloadLink = document.createElement("a");
          downloadLink.href = jpegUrl;
          downloadLink.download = `erd-diagram-${new Date().toISOString().split("T")[0]}.jpeg`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(jpegUrl);
        },
        "image/jpeg",
        0.95
      );

      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [svgRef]);

  const exportToJson = useCallback(() => {
    if (!schema || schema.length === 0) {
      console.log("No schema data to export");
      return;
    }

    const jsonContent = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        tableCount: schema.length,
        schema: schema.map((table) => ({
          tableName: table.table_name,
          columns: table.columns,
          primaryKeys: table.primary_keys,
          foreignKeys: table.foreign_keys,
        })),
      },
      null,
      2
    );

    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `schema-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }, [schema]);

  return {
    exportToSvg,
    exportToPng,
    exportToJpeg,
    exportToJson,
  };
}
