"use client";

import { useEffect, useCallback, useRef } from "react";
import * as d3 from "d3";
import { TableSchema } from "@/app/types/query";
import {
  D3Node,
  D3Link,
  getNodeWidth,
  getNodeHeight,
  getIntersectionPoint,
} from "@/app/utils/erd/nodeHelpers";

export function useD3Diagram(
  svgRef: React.RefObject<SVGSVGElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  schema: TableSchema[]
) {
  const widthRef = useRef<number>(0);
  const heightRef = useRef<number>(0);
  const svgSelectionRef = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const fitToView = useCallback(() => {
    if (!svgRef.current || !svgSelectionRef.current || !zoomRef.current) return;

    const bounds = svgRef.current.querySelector("g")?.getBBox();
    if (!bounds) return;

    const padding = 50;
    const dx = bounds.width + padding * 2;
    const dy = bounds.height + padding * 2;
    const x = bounds.x - padding;
    const y = bounds.y - padding;

    const scale =
      Math.min(widthRef.current / dx, heightRef.current / dy, 1) * 0.85;

    const translate = [
      widthRef.current / 2 - scale * (x + dx / 2),
      heightRef.current / 2 - scale * (y + dy / 2),
    ];

    svgSelectionRef.current
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  }, [svgRef]);

  const zoomIn = useCallback(() => {
    if (!svgSelectionRef.current || !zoomRef.current) return;
    svgSelectionRef.current
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1.3);
  }, []);

  const zoomOut = useCallback(() => {
    if (!svgSelectionRef.current || !zoomRef.current) return;
    svgSelectionRef.current
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 0.7);
  }, []);

  const resetZoom = useCallback(() => {
    if (!svgSelectionRef.current || !zoomRef.current) return;
    svgSelectionRef.current
      .transition()
      .duration(500)
      .ease(d3.easeCubicInOut)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || schema.length === 0) return;

    const container = containerRef.current;
    widthRef.current = container.clientWidth;
    heightRef.current = Math.max(
      600,
      window.innerHeight - (window.innerWidth < 640 ? 300 : 150)
    );

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", heightRef.current)
      .attr("viewBox", `0 0 ${widthRef.current} ${heightRef.current}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("style", "max-width: 100%; height: auto;");

    svgSelectionRef.current = svg;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const g = svg.append("g");

    const nodes: D3Node[] = schema.map((table, index) => ({
      id: table.table_name,
      label: table.table_name,
      columns: table.columns.map((column) => ({
        column_name: column.column_name,
        data_type: column.data_type,
        is_primary_key: column.is_primary_key ?? false,
        is_nullable: column.is_nullable,
      })),
      primary_keys: table.primary_keys,
      x: (index % 4) * (window.innerWidth < 640 ? 400 : 600) + 200,
      y: Math.floor(index / 4) * (window.innerWidth < 640 ? 250 : 350) + 150,
    }));

    const links: D3Link[] = [];
    schema.forEach((table) => {
      table.foreign_keys.forEach((fk) => {
        if (schema.some((t) => t.table_name === fk.referenced_table)) {
          links.push({
            source: table.table_name,
            target: fk.referenced_table,
            label: `${table.table_name}.${fk.column_name} → ${fk.referenced_table}.${fk.referenced_column}`,
          });
        }
      });
    });

    const simulation = d3
      .forceSimulation<D3Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance(window.innerWidth < 640 ? 300 : 500)
          .strength(0.3)
      )
      .force(
        "charge",
        d3.forceManyBody().strength(window.innerWidth < 640 ? -800 : -1200)
      )
      .force(
        "center",
        d3.forceCenter(widthRef.current / 2, heightRef.current / 2)
      )
      .force("x", d3.forceX(widthRef.current / 2).strength(0.05))
      .force("y", d3.forceY(heightRef.current / 2).strength(0.05))
      .force(
        "collision",
        d3.forceCollide().radius((node: d3.SimulationNodeDatum) => {
          const d = node as D3Node;
          return (
            (window.innerWidth < 640 ? 200 : 250) +
            (d.columns?.length || 0) * 12
          );
        })
      )
      .alphaDecay(0.05);

    const link = g
      .selectAll(".link")
      .data(links)
      .enter()
      .append("g")
      .attr("class", "link")
      .lower();

    link
      .append("line")
      .attr("stroke", "#f472b6")
      .attr("stroke-width", window.innerWidth < 640 ? 3 : 4)
      .attr("stroke-dasharray", "5,5")
      .attr("marker-end", "url(#arrow)")
      .attr("stroke-opacity", 0.8);

    link.append("title").text((d: D3Link) => d.label);

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", window.innerWidth < 640 ? 8 : 10)
      .attr("markerHeight", window.innerWidth < 640 ? 8 : 10)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#f472b6");

    const node = g
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("rect")
      .attr("width", (d) => getNodeWidth(d))
      .attr("height", (d) => getNodeHeight(d))
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", "#1e293b")
      .attr("stroke", "#06b6d4")
      .attr("stroke-width", window.innerWidth < 640 ? 1.5 : 2)
      .style("filter", "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))");

    node
      .append("text")
      .attr("x", 12)
      .attr("y", 28)
      .attr("fill", "#06b6d4")
      .attr("font-size", window.innerWidth < 640 ? "14px" : "16px")
      .attr("font-weight", "bold")
      .text((d) => d.label)
      .style("text-overflow", "ellipsis")
      .style("overflow", "hidden")
      .style("white-space", "nowrap")
      .style("max-width", (d) => getNodeWidth(d) - 24);

    node
      .append("line")
      .attr("x1", 12)
      .attr("y1", 40)
      .attr("x2", (d) => getNodeWidth(d) - 12)
      .attr("y2", 40)
      .attr("stroke", "#06b6d4")
      .attr("stroke-width", window.innerWidth < 640 ? 1 : 1.5);

    node.each(function (d) {
      const group = d3.select(this);
      const headers = ["Column", "Type", "Nullable", "Ref Table", "References"];
      const offsets = [
        12,
        getNodeWidth(d) * 0.35 + 12,
        getNodeWidth(d) * 0.55 + 12,
        getNodeWidth(d) * 0.75 + 12,
        getNodeWidth(d) * 0.85 + 12,
      ];

      headers.forEach((header, i) => {
        group
          .append("text")
          .attr("x", offsets[i])
          .attr("y", 56)
          .attr("fill", "#06b6d4")
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          .attr("font-weight", "bold")
          .text(header)
          .style("text-overflow", "ellipsis")
          .style("overflow", "hidden")
          .style("white-space", "nowrap")
          .style(
            "max-width",
            getNodeWidth(d) * (i < headers.length - 1 ? 0.2 : 0.15) - 12
          );
      });
    });

    node.each(function (d) {
      const group = d3.select(this);
      (d.columns || []).forEach((column, i) => {
        const isPrimary = d.primary_keys.includes(column.column_name);
        const fk = schema
          .find((t) => t.table_name === d.id)
          ?.foreign_keys.find((fk) => fk.column_name === column.column_name);

        group
          .append("text")
          .attr("x", 12)
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          .attr("fill", isPrimary ? "#fbbf24" : fk ? "#f472b6" : "#e0e6ed")
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          .attr("font-weight", isPrimary ? "bold" : "normal")
          .text(
            `${column.column_name}${isPrimary ? " [PK]" : fk ? " [FK]" : ""}`
          )
          .style("text-overflow", "ellipsis")
          .style("overflow", "hidden")
          .style("white-space", "nowrap")
          .style("max-width", getNodeWidth(d) * 0.35 - 12);

        group
          .append("text")
          .attr("x", getNodeWidth(d) * 0.35 + 12)
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          .attr("fill", "#d1d5db")
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          .text(column.data_type)
          .style("text-overflow", "ellipsis")
          .style("overflow", "hidden")
          .style("white-space", "nowrap")
          .style("max-width", getNodeWidth(d) * 0.2 - 12);

        group
          .append("text")
          .attr("x", getNodeWidth(d) * 0.55 + 12)
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          .attr("fill", "#d1d5db")
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          .text(column.is_nullable)
          .style("text-overflow", "ellipsis")
          .style("overflow", "hidden")
          .style("white-space", "nowrap")
          .style("max-width", getNodeWidth(d) * 0.2 - 12);

        group
          .append("text")
          .attr("x", getNodeWidth(d) * 0.75 + 12)
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          .attr("fill", fk ? "#ff69b4" : "#d1d5db")
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          .text(fk ? fk.referenced_table : "-")
          .style("text-overflow", "ellipsis")
          .style("overflow", "hidden")
          .style("white-space", "nowrap")
          .style("max-width", getNodeWidth(d) * 0.1 - 12);

        group
          .append("text")
          .attr("x", getNodeWidth(d) * 0.85 + 12)
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          .attr("fill", fk ? "#ff69b4" : "#d1d5db")
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          .text(fk ? fk.referenced_column : "-")
          .style("text-overflow", "ellipsis")
          .style("overflow", "hidden")
          .style("white-space", "nowrap")
          .style("max-width", getNodeWidth(d) * 0.15 - 12);
      });
    });

    simulation.on("tick", () => {
      link
        .select("line")
        .attr("x1", (d: D3Link) => {
          const source = d.source as D3Node;
          const target = d.target as D3Node;
          const intersection = getIntersectionPoint(
            target.x ?? 0,
            target.y ?? 0,
            source.x ?? 0,
            source.y ?? 0,
            source
          );
          return intersection.x;
        })
        .attr("y1", (d: D3Link) => {
          const source = d.source as D3Node;
          const target = d.target as D3Node;
          const intersection = getIntersectionPoint(
            target.x ?? 0,
            target.y ?? 0,
            source.x ?? 0,
            source.y ?? 0,
            source
          );
          return intersection.y;
        })
        .attr("x2", (d: D3Link) => {
          const source = d.source as D3Node;
          const target = d.target as D3Node;
          const intersection = getIntersectionPoint(
            source.x ?? 0,
            source.y ?? 0,
            target.x ?? 0,
            target.y ?? 0,
            target
          );
          return intersection.x;
        })
        .attr("y2", (d: D3Link) => {
          const source = d.source as D3Node;
          const target = d.target as D3Node;
          const intersection = getIntersectionPoint(
            source.x ?? 0,
            source.y ?? 0,
            target.x ?? 0,
            target.y ?? 0,
            target
          );
          return intersection.y;
        });

      node.attr("transform", (d: D3Node) => {
        const x = d.x ?? 0;
        const y = d.y ?? 0;
        return `translate(${x - getNodeWidth(d) / 2},${
          y - getNodeHeight(d) / 2
        })`;
      });
    });

    setTimeout(fitToView, 500);

    return () => {
      simulation.stop();
    };
  }, [schema, fitToView, svgRef, containerRef]);

  return {
    zoomIn,
    zoomOut,
    resetZoom,
    fitToView,
  };
}
