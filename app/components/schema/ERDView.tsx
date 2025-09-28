"use client";

import { useEffect, useRef, useCallback } from "react";
import { TableSchema } from "@/app/types/query";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";

// Props for the ERDView component
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

// Props for the D3Link component
interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  label: string;
}

// Props for the ERDView component
interface ERDViewProps {
  schema: TableSchema[];
}

export default function ERDView({ schema }: ERDViewProps) {
  // Create the svg ref
  const svgRef = useRef<SVGSVGElement | null>(null);
  // Create the container ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Create the width ref
  const widthRef = useRef<number>(0);
  // Create the height ref 
  const heightRef = useRef<number>(0);
  // Create the svg selection ref 
  const svgSelectionRef = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  // Create the zoom ref
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  // Function to get the node width
  const getNodeWidth = (d: D3Node) => {
    // Create the max label width by the label length and the 12 and the minimum of 800 and the maximum of 500
    const maxLabelWidth = Math.min(800, Math.max(500, d.label.length * 12));
    // Return the maximum of the max label width and the 500
    return Math.max(maxLabelWidth, 500); 
  };
  // Function to get the node height
  const getNodeHeight = (d: D3Node) =>
    // Create the node height by the 60 and the columns length and the inner width and the minimum of 20 and the maximum of 24
    60 + (d.columns?.length || 0) * (window.innerWidth < 640 ? 20 : 24);

  // Function to calculate intersection point of a line with a rectangle
  const getIntersectionPoint = useCallback((
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    node: D3Node
  ) => {
    // Create the node width by the node
    const nodeWidth = getNodeWidth(node);
    // Create the node height by the node
    const nodeHeight = getNodeHeight(node);
    // Create the node center x by the node x
    const nodeCenterX = node.x ?? 0;
    // Create the node center y by the node y
    const nodeCenterY = node.y ?? 0;
    // Create the left by the node center x and the node width and the 2
    const left = nodeCenterX - nodeWidth / 2;
    // Create the right by the node center x and the node width and the 2
    const right = nodeCenterX + nodeWidth / 2;
    // Create the top by the node center y and the node height and the 2
    const top = nodeCenterY - nodeHeight / 2;
    // Create the bottom by the node center y and the node height and the 2
    const bottom = nodeCenterY + nodeHeight / 2;
    // Create the dx by the target x and the source x
    const dx = targetX - sourceX;
    // Create the dy by the target y and the source y
    const dy = targetY - sourceY;
    // Create the intersection x by the target x
    let intersectionX = targetX;
    // Create the intersection y by the target y
    let intersectionY = targetY;
    // If the dx and the dy are 0
    if (dx === 0 && dy === 0) {
      // Return the intersection x and the intersection y
      return { x: intersectionX, y: intersectionY };
    }
    // Check intersection with each side of the rectangle
    if (dx !== 0) {
      // Create the slope by the dy and the dx
      const slope = dy / dx;
      // Create the y at left by the source y and the slope and the left and the source x
      const yAtLeft = sourceY + slope * (left - sourceX);
      // Create the y at right by the source y and the slope and the right and the source x
      const yAtRight = sourceY + slope * (right - sourceX);
      // If the y at left is greater than or equal to the top and 
      // the y at left is less than or equal to the bottom and 
      // the source x is less than or equal to the left
      if (yAtLeft >= top && yAtLeft <= bottom && sourceX <= left) {
        // Set the intersection x to the left
        intersectionX = left;
        // Set the intersection y to the y at left
        intersectionY = yAtLeft;
      } else if (yAtRight >= top && yAtRight <= bottom && sourceX >= right) {
        // Set the intersection x to the right
        intersectionX = right;
        // Set the intersection y to the y at right
        intersectionY = yAtRight;
      }
    }
    // If the dy is not 0
    if (dy !== 0) {
      // Create the inv slope by the dx and the dy
      const invSlope = dx / dy;
      // Create the x at top by the source X and the inv slope and the top and the source y
      const xAtTop = sourceX + invSlope * (top - sourceY);
      // Create the x at bottom by the source X and the inv slope and the bottom and the source y
      const xAtBottom = sourceX + invSlope * (bottom - sourceY);
      // If the x at top is greater than or equal to the left and 
      if (xAtTop >= left && xAtTop <= right && sourceY >= bottom) {
        // Set the intersection x to the x at top
        intersectionX = xAtTop;
        // Set the intersection y to the top
        intersectionY = top;
      } else if (xAtBottom >= left && xAtBottom <= right && sourceY <= top) {
        // Set the intersection x to the x at bottom
        intersectionX = xAtBottom;
        // Set the intersection y to the bottom
        intersectionY = bottom;
      }
    }
    // Return the intersection x and the intersection y
    return { x: intersectionX, y: intersectionY };
  }, []);
  // Function to fit to view
  const fitToView = () => {
    // If the svg ref current or the svg selection ref current or the zoom ref current is not null
    if (!svgRef.current || !svgSelectionRef.current || !zoomRef.current) return;
    // Create the bounds by the svg ref current and the query selector g and the get bbox
    const bounds = svgRef.current.querySelector("g")?.getBBox();
    // If the bounds is not null
    if (!bounds) return;
    // Create the dx by the bounds width
    const dx = bounds.width;
    // Create the dy by the bounds height
    const dy = bounds.height;
    // Create the x by the bounds x and the dx and the 2
    const x = bounds.x + dx / 2;
    // Create the y by the bounds y and the dy and the 2
    const y = bounds.y + dy / 2;
    // Create the scale by the width ref current and the dx and the height ref current and the dy and the 1 and the 0.9
    const scale =
      Math.min(widthRef.current / dx, heightRef.current / dy, 1) * 0.9;
      const translate = [
      widthRef.current / 2 - scale * x,
      heightRef.current / 2 - scale * y,
    ];
    // Transition the svg selection ref current
    svgSelectionRef.current
      .transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  };
  useEffect(() => {
    // If the svg ref current or the container ref current or the schema length is 0
    if (!svgRef.current || !containerRef.current || schema.length === 0) return;
    // Create the container by the container ref current
    const container = containerRef.current;
    // Set the width ref current to the container client width
    widthRef.current = container.clientWidth;
    // Set the height ref current to the maximum of 600 and the window inner height and the window inner width and the 200 and the 100
    heightRef.current = Math.max(
      600,
      window.innerHeight - (window.innerWidth < 640 ? 200 : 100)
    );
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    // Initialize SVG
    const svg = d3
      // Select the svg ref current
      .select(svgRef.current)
      // Set the width to 100%
      .attr("width", "100%")
      // Set the height to the height ref current
      .attr("height", heightRef.current)
      // Set the view box to the width ref current and the height ref current
      .attr("viewBox", `0 0 ${widthRef.current} ${heightRef.current}`)
      // Set the preserve aspect ratio to xMidYMid meet
      .attr("preserveAspectRatio", "xMidYMid meet")
      // Set the style to max-width: 100%; height: auto;
      .attr("style", "max-width: 100%; height: auto;");
    // Set the svg selection ref current to the svg
    svgSelectionRef.current = svg;
    // Initialize zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    // Set the zoom ref current to the zoom
    zoomRef.current = zoom;
    // Call the svg and the zoom
    svg.call(zoom);
    // Create the g by the svg and the append g
    const g = svg.append("g");
    // Create the nodes by the schema
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
    // Create the links by the schema
    const links: D3Link[] = [];
    // Loop through the schema
    schema.forEach((table) => {
      // Loop through the foreign keys
      table.foreign_keys.forEach((fk) => {
        // Verify that the referenced table exists in the schema
        if (schema.some((t) => t.table_name === fk.referenced_table)) {
          // Push the link to the links
          links.push({
            source: table.table_name,
            target: fk.referenced_table,
            label: `${table.table_name}.${fk.column_name} → ${fk.referenced_table}.${fk.referenced_column}`,
          });
        }
      });
    });
    // Create the simulation by the nodes
    const simulation = d3
      // Force simulation with the nodes
      .forceSimulation<D3Node>(nodes)
      // Force the link with the links
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance(window.innerWidth < 640 ? 400 : 600)
          .strength(0.5)
      )
      // Force the charge with the many body
      .force(
        "charge",
        d3.forceManyBody().strength(window.innerWidth < 640 ? -1200 : -1800)
      )
      // Force the center with the width ref current and the height ref current
      .force(
        "center",
        d3.forceCenter(widthRef.current / 2, heightRef.current / 2)
      )
      // Force the x with the width ref current and the 2
      .force("x", d3.forceX(widthRef.current / 2).strength(0.05))
      // Force the y with the height ref current and the 2
      .force("y", d3.forceY(heightRef.current / 2).strength(0.05))
      // Force the collision with the force collide
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
      // Force the alpha decay with the 0.05
      .alphaDecay(0.05);
    // Draw links
    const link = g
      // Select the g and the class link
      .selectAll(".link")
      // Data the links
      .data(links)
      // Enter the g
      .enter()
      // Append the g
      .append("g")
      // Set the class to link
      .attr("class", "link")
      // Lower the g
      .lower();
    // Append the line to the link
    link
      // Append the line
      .append("line")
      // Set the stroke to the 22c55e
      .attr("stroke", "#22c55e")
      // Set the stroke width to the window inner width and the 640 and the 3 and the 4
      .attr("stroke-width", window.innerWidth < 640 ? 3 : 4)
      // Set the stroke dasharray to the 5 and the 5
      .attr("stroke-dasharray", "5,5")
      // Set the marker end to the url arrow
      .attr("marker-end", "url(#arrow)")
      // Set the stroke opacity to the 0.8
      .attr("stroke-opacity", 0.8);
    // Append the title to the link
    link.append("title").text((d: D3Link) => d.label);
    svg
    // Append the defs to the svg
      .append("defs")
      // Append the marker to the defs
      .append("marker")
      // Set the id to the arrow
      .attr("id", "arrow")
      // Set the view box to the 0 and the -5 and the 10 and the 10
      .attr("viewBox", "0 -5 10 10")
      // Set the ref x to the 10
      .attr("refX", 10)
      // Set the ref y to the 0
      .attr("refY", 0)
      // Set the marker width to the window inner width and the 640 and the 8 and the 10
      .attr("markerWidth", window.innerWidth < 640 ? 8 : 10)
      // Set the marker height to the window inner width and the 640 and the 8 and the 10
      .attr("markerHeight", window.innerWidth < 640 ? 8 : 10)
      // Set the orient to the auto
      .attr("orient", "auto")
      // Append the path to the marker
      .append("path")
      // Set the d to the M0,-5L10,0L0,5
      .attr("d", "M0,-5L10,0L0,5")
      // Set the fill to the 22c55e
      .attr("fill", "#22c55e");
    // Create the node by the g
      const node = g
      // Select the g and the class node
      .selectAll(".node")
      // Data the nodes
      .data(nodes)
      // Enter the g
      .enter()
      // Append the g
      .append("g")
      // Set the class to node
      .attr("class", "node")
      // Call the drag
      .call(
        d3
          // Drag the g and the node
          .drag<SVGGElement, D3Node>()
          // On start
          .on("start", (event, d) => {
            // If the event is not active
            if (!event.active) simulation.alphaTarget(0.3).restart();
            // Set the fx to the d x
            d.fx = d.x;
            // Set the fy to the d y
            d.fy = d.y;
          })
          // On drag
          .on("drag", (event, d) => {
            // Set the fx to the event x
            d.fx = event.x;
            // Set the fy to the event y
            d.fy = event.y;
          })
          // On end
          .on("end", (event, d) => {
            // If the event is not active
            if (!event.active) simulation.alphaTarget(0);
            // Set the fx to null
            d.fx = null;
            // Set the fy to null
            d.fy = null;
          })
      );
    // Append the rect to the node
    node
      .append("rect")
      // Set the width to the get node width
      .attr("width", (d) => getNodeWidth(d))
      // Set the height to the get node height
      .attr("height", (d) => getNodeHeight(d))
      // Set the rx to the 12
      .attr("rx", 12)
      // Set the ry to the 12
      .attr("ry", 12)
      // Set the fill to the #1e293b
      .attr("fill", "#1e293b")
      // Set the stroke to the #4ade80
      .attr("stroke", "#4ade80")
      // Set the stroke width to the window inner width and the 640 and the 1.5 and the 2
      .attr("stroke-width", window.innerWidth < 640 ? 1.5 : 2)
      // Set the filter to the drop shadow
      .style("filter", "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))");
    // Node title with truncation
    node
      // Append the text to the node
      .append("text")
      // Set the x to the 12
      .attr("x", 12)
      // Set the y to the 28
      .attr("y", 28)
      // Set the fill to the #4ade80
      .attr("fill", "#4ade80")
      // Set the font size to the window inner width and the 640 and the 14px and the 16px
      .attr("font-size", window.innerWidth < 640 ? "14px" : "16px")
      // Set the font weight to the bold
      .attr("font-weight", "bold")
      // Set the text to the d label
      .text((d) => d.label)
      // Set the text overflow to the ellipsis
      .style("text-overflow", "ellipsis")
      // Set the overflow to the hidden
      .style("overflow", "hidden")
      // Set the white space to the nowrap
      .style("white-space", "nowrap")
      // Set the max width to the get node width and the 24
      .style("max-width", (d) => getNodeWidth(d) - 24);
      // Append the line to the node
      node
      .append("line")
      // Set the x1 to the 12
      .attr("x1", 12)
      // Set the y1 to the 40
      .attr("y1", 40)
      // Set the x2 to the get node width and the 12
      .attr("x2", (d) => getNodeWidth(d) - 12)
      // Set the y2 to the 40
      .attr("y2", 40)
      // Set the stroke to the #4ade80
      .attr("stroke", "#4ade80")
      // Set the stroke width to the window inner width and the 640 and the 1 and the 1.5
      .attr("stroke-width", window.innerWidth < 640 ? 1 : 1.5);

    // Append the text to the node
    node.each(function (d) {
      // Select the this
      const group = d3.select(this);
      // Create the headers by the Column, Type, Nullable, Ref Table, and References
      const headers = ["Column", "Type", "Nullable", "Ref Table", "References"];
      // Create the offsets
      const offsets = [
        12,
        getNodeWidth(d) * 0.35 + 12,
        getNodeWidth(d) * 0.55 + 12,
        getNodeWidth(d) * 0.75 + 12,
        getNodeWidth(d) * 0.85 + 12,
      ];
      // Loop through the headers
      headers.forEach((header, i) => {
        // Append the text to the group
        group
          .append("text")
          // Set the x to the offsets at index i
          .attr("x", offsets[i])
          // Set the y to the 56
          .attr("y", 56)
          // Set the fill to the #4ade80
          .attr("fill", "#4ade80")
          // Set the font size to the window inner width and the 640 and the 10px and the 12px
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          // Set the font weight to the bold
          .attr("font-weight", "bold")
          // Set the text to the header
          .text(header)
          // Set the text overflow to the ellipsis
          .style("text-overflow", "ellipsis")
          // Set the overflow to the hidden
          .style("overflow", "hidden")
          // Set the white space to the nowrap
          .style("white-space", "nowrap")
          // Set the max width to the get node width and the (i < headers.length - 1 ? 0.2 : 0.15) and the 12
          .style(
            "max-width",
            getNodeWidth(d) * (i < headers.length - 1 ? 0.2 : 0.15) - 12
          );
      });
    });
    // Append the text to the node
    node.each(function (d) {
      // Select the this
      const group = d3.select(this);
      // Loop through the d columns
      (d.columns || []).forEach((column, i) => {
        // Create the is primary by the d primary keys and the column column name
        const isPrimary = d.primary_keys.includes(column.column_name);
        // Create the fk by the schema and the d id and the column column name
        const fk = schema
          // Find the table by the schema and the d id
          .find((t) => t.table_name === d.id)
          // Find the foreign key by the schema and the d id and the column column name
          ?.foreign_keys.find((fk) => fk.column_name === column.column_name);
        // Append the text to the group
        group
          .append("text")
          // Set the x to the 12
          .attr("x", 12)
          // Set the y to the 76 and the i and the window inner width and the 640 and the 20 and the 24
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          // Set the fill to the is primary and the fk and the #d1d5db
          .attr("fill", isPrimary ? "#ffd700" : fk ? "#ff69b4" : "#d1d5db")
          // Set the font size to the window inner width and the 640 and the 10px and the 12px
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          // Set the font weight to the is primary and the bold and the normal
          .attr("font-weight", isPrimary ? "bold" : "normal")
          // Set the text to the column column name and the is primary and the fk and the [PK] and the [FK]
          .text(
            `${column.column_name}${isPrimary ? " [PK]" : fk ? " [FK]" : ""}`
          )
          // Set the text overflow to the ellipsis
          .style("text-overflow", "ellipsis")
          // Set the overflow to the hidden
          .style("overflow", "hidden")
          // Set the white space to the nowrap
          .style("white-space", "nowrap")
          // Set the max width to the get node width and the 0.35 and the 12
          .style("max-width", getNodeWidth(d) * 0.35 - 12);
        group
          // Append the text to the group
          .append("text")
          // Set the x to the get node width and the 0.35 and the 12
          .attr("x", getNodeWidth(d) * 0.35 + 12)
          // Set the y to the 76 and the i and the window inner width and the 640 and the 20 and the 24
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          // Set the fill to the #d1d5db
          .attr("fill", "#d1d5db")
          // Set the font size to the window inner width and the 640 and the 10px and the 12px
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          // Set the text to the column data type
          .text(column.data_type)
          // Set the text overflow to the ellipsis
          .style("text-overflow", "ellipsis")
          // Set the overflow to the hidden
          .style("overflow", "hidden")
          // Set the white space to the nowrap
          .style("white-space", "nowrap")
          // Set the max width to the get node width and the 0.2 and the 12
          .style("max-width", getNodeWidth(d) * 0.2 - 12);
        group
          // Append the text to the group
          .append("text")
          // Set the x to the get node width and the 0.55 and the 12
          .attr("x", getNodeWidth(d) * 0.55 + 12)
          // Set the y to the 76 and the i and the window inner width and the 640 and the 20 and the 24
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          // Set the fill to the #d1d5db
          .attr("fill", "#d1d5db")
          // Set the font size to the window inner width and the 640 and the 10px and the 12px
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          // Set the text to the column is nullable
          .text(column.is_nullable)
          // Set the text overflow to the ellipsis
          .style("text-overflow", "ellipsis")
          // Set the overflow to the hidden
          .style("overflow", "hidden")
          // Set the white space to the nowrap
          .style("white-space", "nowrap")
          // Set the max width to the get node width and the 0.2 and the 12
          .style("max-width", getNodeWidth(d) * 0.2 - 12);
        group
          // Append the text to the group
          .append("text")
          // Set the x to the get node width and the 0.75 and the 12
          .attr("x", getNodeWidth(d) * 0.75 + 12)
          // Set the y to the 76 and the i and the window inner width and the 640 and the 20 and the 24
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          // Set the fill to the fk and the #d1d5db
          .attr("fill", fk ? "#ff69b4" : "#d1d5db")
          // Set the font size to the window inner width and the 640 and the 10px and the 12px
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          // Set the text to the fk referenced table or the -
          .text(fk ? fk.referenced_table : "-")
          // Set the text overflow to the ellipsis
          .style("text-overflow", "ellipsis")
          // Set the overflow to the hidden
          .style("overflow", "hidden")
          // Set the white space to the nowrap
          .style("white-space", "nowrap")
          // Set the max width to the get node width and the 0.1 and the 12
          .style("max-width", getNodeWidth(d) * 0.1 - 12);

        // References
        group
          // Append the text to the group
          .append("text")
          // Set the x to the get node width and the 0.85 and the 12
          .attr("x", getNodeWidth(d) * 0.85 + 12)
          // Set the y to the 76 and the i and the window inner width and the 640 and the 20 and the 24
          .attr("y", 76 + i * (window.innerWidth < 640 ? 20 : 24))
          // Set the fill to the fk and the #d1d5db
          .attr("fill", fk ? "#ff69b4" : "#d1d5db")
          // Set the font size to the window inner width and the 640 and the 10px and the 12px
          .attr("font-size", window.innerWidth < 640 ? "10px" : "12px")
          // Set the text to the fk referenced column or the -
          .text(fk ? fk.referenced_column : "-")
          // Set the text overflow to the ellipsis
          .style("text-overflow", "ellipsis")
          // Set the overflow to the hidden
          .style("overflow", "hidden")
          // Set the white space to the nowrap
          .style("white-space", "nowrap")
          // Set the max width to the get node width and the 0.15 and the 12
          .style("max-width", getNodeWidth(d) * 0.15 - 12);
      });
    });
    simulation.on("tick", () => {
      link
        // Select the link and the line and the x1  
        .select("line")
        .attr("x1", (d: D3Link) => {
          // Create the source by the d source
          const source = d.source as D3Node;
          // Create the target by the d target
          const target = d.target as D3Node;
          // Create the intersection by the target x and the target y and the source x and the source y and the node
          const intersection = getIntersectionPoint(
            target.x ?? 0,
            target.y ?? 0,
            source.x ?? 0,
            source.y ?? 0,
            source
          );
          // Return the intersection x
          return intersection.x;
        })
        // Select the link and the line and the y1
        .attr("y1", (d: D3Link) => {
          // Create the source by the d source
          const source = d.source as D3Node;
          // Create the target by the d target
          const target = d.target as D3Node;
          // Create the intersection by the target x and the target y and the source x and the source y and the node
          const intersection = getIntersectionPoint(
            target.x ?? 0,
            target.y ?? 0,
            source.x ?? 0,
            source.y ?? 0,
            source
          );
          // Return the intersection y
          return intersection.y;
        })
        // Select the link and the line and the x2
        .attr("x2", (d: D3Link) => {
          // Create the source by the d source
          const source = d.source as D3Node;
          // Create the target by the d target
          const target = d.target as D3Node;
          // Create the intersection by the target x and the target y and the source x and the source y and the node
          const intersection = getIntersectionPoint(
            source.x ?? 0,
            source.y ?? 0,
            target.x ?? 0,
            target.y ?? 0,
            target
          );
          // Return the intersection x
          return intersection.x;
        })
        // Select the link and the line and the y2
        .attr("y2", (d: D3Link) => {
          // Create the source by the d source
          const source = d.source as D3Node;
          // Create the target by the d target
          const target = d.target as D3Node;
          // Create the intersection by the target x and the target y and the source x and the source y and the node
          const intersection = getIntersectionPoint(
            source.x ?? 0,
            source.y ?? 0,
            target.x ?? 0,
            target.y ?? 0,
            target
          );
          // Return the intersection y
          return intersection.y;
        });
      // Select the node and the transform
      node.attr("transform", (d: D3Node) => {
        // Create the x by the d x
        const x = d.x ?? 0;
        // Create the y by the d y
        const y = d.y ?? 0;
        // Return the translate
        return `translate(${x - getNodeWidth(d) / 2},${
          y - getNodeHeight(d) / 2
        })`;
      });
    });
    // Set timeout to fit to view
    setTimeout(fitToView, 500);

    return () => {
      simulation.stop();
    };
  }, [schema, getIntersectionPoint]);

  return (
    <div
      ref={containerRef}
      className="bg-[#111827] rounded-lg p-4 overflow-hidden relative erd-container"
    >
      <Button
        onClick={fitToView}
        className="absolute top-4 right-4 bg-green-400 text-[#111827] px-4 py-2 rounded hover:bg-green-500"
      >
        Fit to View
      </Button>
      <svg ref={svgRef}></svg>
    </div>
  );
}
