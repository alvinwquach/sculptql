export interface D3Node extends d3.SimulationNodeDatum {
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

export interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  label: string;
}

export const getNodeWidth = (d: D3Node): number => {
  const maxLabelWidth = Math.min(800, Math.max(500, d.label.length * 12));
  return Math.max(maxLabelWidth, 500);
};

export const getNodeHeight = (d: D3Node): number => {
  return 60 + (d.columns?.length || 0) * (window.innerWidth < 640 ? 20 : 24);
};

export const getIntersectionPoint = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  node: D3Node
): { x: number; y: number } => {
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
