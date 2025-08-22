"use client";

import { useEffect, useRef } from "react";
import { TableSchema } from "@/app/types/query";
import * as d3 from "d3";

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  columns: {
    column_name: string;
    data_type: string;
    is_primary_key: boolean;
    is_nullable: string;
  }[];
  primary_keys: string[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  label: string;
}

interface ERDViewProps {
  schema: TableSchema[];
}

export default function ERDView({ schema }: ERDViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widthRef = useRef<number>(0);
  const heightRef = useRef<number>(0);
  const svgSelectionRef = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Dynamic node width based on content
  const getNodeWidth = (d: D3Node) => {
    const maxLabelWidth = Math.min(800, Math.max(500, d.label.length * 12));
    return Math.max(maxLabelWidth, 500); // Minimum 500px, capped at 800px
  };

  // Calculate node height
  const getNodeHeight = (d: D3Node) =>
    60 + (d.columns?.length || 0) * (window.innerWidth < 640 ? 20 : 24);

  // Function to calculate intersection point of a line with a rectangle
  const getIntersectionPoint = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    node: D3Node
  ) => {
    const nodeWidth = getNodeWidth(node);
    const nodeHeight = getNodeHeight(node);
    const nodeCenterX = node.x ?? 0;
    const nodeCenterY = node.y ?? 0;
    const left = nodeCenterX - nodeWidth / 2;
    const right = nodeCenterX + nodeWidth / 2;
    const top = nodeCenterY - nodeHeight / 2;
    const bottom = nodeCenterY + nodeHeight / 2;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    let intersectionX = targetX;
    let intersectionY = targetY;

    if (dx === 0 && dy === 0) {
      return { x: intersectionX, y: intersectionY };
    }

    // Check intersection with each side of the rectangle
    if (dx !== 0) {
      const slope = dy / dx;
      const yAtLeft = sourceY + slope * (left - sourceX);
      const yAtRight = sourceY + slope * (right - sourceX);

      if (yAtLeft >= top && yAtLeft <= bottom && sourceX <= left) {
        intersectionX = left;
        intersectionY = yAtLeft;
      } else if (yAtRight >= top && yAtRight <= bottom && sourceX >= right) {
        intersectionX = right;
        intersectionY = yAtRight;
      }
    }

    if (dy !== 0) {
      const invSlope = dx / dy;
      const xAtTop = sourceX + invSlope * (top - sourceY);
      const xAtBottom = sourceX + invSlope * (bottom - sourceY);

      if (xAtTop >= left && xAtTop <= right && sourceY >= bottom) {
        intersectionX = xAtTop;
        intersectionY = top;
      } else if (xAtBottom >= left && xAtBottom <= right && sourceY <= top) {
        intersectionX = xAtBottom;
        intersectionY = bottom;
      }
    }

    return { x: intersectionX, y: intersectionY };
  };

  const fitToView = () => {
    if (!svgRef.current || !svgSelectionRef.current || !zoomRef.current) return;

    const bounds = svgRef.current.querySelector("g")?.getBBox();
    if (!bounds) return;

    const dx = bounds.width;
    const dy = bounds.height;
    const x = bounds.x + dx / 2;
    const y = bounds.y + dy / 2;
    const scale =
      Math.min(widthRef.current / dx, heightRef.current / dy, 1) * 0.9;
    const translate = [
      widthRef.current / 2 - scale * x,
      heightRef.current / 2 - scale * y,
    ];

    svgSelectionRef.current
      .transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || schema.length === 0) return;

    // Get container dimensions
    const container = containerRef.current;
    widthRef.current = container.clientWidth;
    heightRef.current = Math.max(
      600,
      window.innerHeight - (window.innerWidth < 640 ? 200 : 100)
    );

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Initialize SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", heightRef.current)
      .attr("viewBox", `0 0 ${widthRef.current} ${heightRef.current}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("style", "max-width: 100%; height: auto;");

    svgSelectionRef.current = svg;

    // Initialize zoom
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
      x: (index % 6) * (window.innerWidth < 640 ? 600 : 900) + 300,
      y: Math.floor(index / 6) * (window.innerWidth < 640 ? 300 : 400) + 200,
    }));

    const links: D3Link[] = [];
    schema.forEach((table) => {
      table.foreign_keys.forEach((fk) => {
        // Verify that the referenced table exists in the schema
        if (schema.some((t) => t.table_name === fk.referenced_table)) {
          links.push({
            source: table.table_name,
            target: fk.referenced_table,
            label: `${table.table_name}.${fk.column_name} → ${fk.referenced_table}.${fk.referenced_column}`,
          });
        }
      });
    });

    // Initialize force simulation with higher alpha for faster stabilization
    const simulation = d3
      .forceSimulation<D3Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance(window.innerWidth < 640 ? 400 : 600)
          .strength(0.5)
      )
      .force(
        "charge",
        d3.forceManyBody().strength(window.innerWidth < 640 ? -1200 : -1800)
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
            (window.innerWidth < 640 ? 300 : 350) +
            (d.columns?.length || 0) * 15
          );
        })
      )
      .alphaDecay(0.05);

    // Draw links
    const link = g
      .selectAll(".link")
      .data(links)
      .enter()
      .append("g")
      .attr("class", "link")
      .lower();

    link
      .append("line")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", window.innerWidth < 640 ? 3 : 4)
      .attr("stroke-dasharray", "5,5")
      .attr("marker-end", "url(#arrow)")
      .attr("stroke-opacity", 0.8);

    // Add tooltips to links
    link.append("title").text((d: D3Link) => d.label);

    // Define arrow marker
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
      .attr("fill", "#22c55e");

    // Draw nodes
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

    // Node rectangle
    node
      .append("rect")
      .attr("width", (d) => getNodeWidth(d))
      .attr("height", (d) => getNodeHeight(d))
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", "#1e293b")
      .attr("stroke", "#4ade80")
      .attr("stroke-width", window.innerWidth < 640 ? 1.5 : 2)
      .style("filter", "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))");

    // Node title with truncation
    node
      .append("text")
      .attr("x", 12)
      .attr("y", 28)
      .attr("fill", "#4ade80")
      .attr("font-size", window.innerWidth < 640 ? "14px" : "16px")
      .attr("font-weight", "bold")
      .text((d) => d.label)
      .style("text-overflow", "ellipsis")
      .style("overflow", "hidden")
      .style("white-space", "nowrap")
      .style("max-width", (d) => getNodeWidth(d) - 24);

    // Divider line
    node
      .append("line")
      .attr("x1", 12)
      .attr("y1", 40)
      .attr("x2", (d) => getNodeWidth(d) - 12)
      .attr("y2", 40)
      .attr("stroke", "#4ade80")
      .attr("stroke-width", window.innerWidth < 640 ? 1 : 1.5);

    // Column headers
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
          .attr("fill", "#4ade80")
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

    // Columns
    node.each(function (d) {
      const group = d3.select(this);
      (d.columns || []).forEach((column, i) => {
        const isPrimary = d.primary_keys.includes(column.column_name);
        const fk = schema
          .find((t) => t.table_name === d.id)
          ?.foreign_keys.find((fk) => fk.column_name === column.column_name);

        // Column name
        group
          .append("text")
          .attr("x", 12)
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          .attr("fill", isPrimary ? "#ffd700" : fk ? "#ff69b4" : "#d1d5db")
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          .attr("font-weight", isPrimary ? "bold" : "normal")
          .text(
            `${column.column_name}${isPrimary ? " [PK]" : fk ? " [FK]" : ""}`
          )
          .style("text-overflow", "ellipsis")
          .style("overflow", "hidden")
          .style("white-space", "nowrap")
          .style("max-width", getNodeWidth(d) * 0.35 - 12);

        // Data type
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

        // Nullable
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

        // Referenced table
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

        // References
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

    // Update positions
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
  }, [schema]);

  return (
    <div
      ref={containerRef}
      className="bg-[#111827] rounded-lg p-4 overflow-hidden relative erd-container"
    >
      <button
        onClick={fitToView}
        className="absolute top-4 right-4 bg-green-400 text-[#111827] px-4 py-2 rounded hover:bg-green-500"
      >
        Fit to View
      </button>
      <svg ref={svgRef}></svg>
    </div>
  );
}
