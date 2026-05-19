// client/components/flow/SmartAvoidEdge.tsx
import React, { useMemo } from 'react';
import { 
  EdgeProps, 
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
} from 'reactflow';

// =============================================
// TYPES
// =============================================
interface Point2D {
  x: number;
  y: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  id: string;
  type: string;
}

// =============================================
// GEOMETRY HELPERS
// =============================================

/**
 * Cek apakah titik berada di dalam bounding box (dengan margin)
 */
function pointInRect(px: number, py: number, rect: BoundingBox, margin: number = 0): boolean {
  return (
    px >= rect.x - margin &&
    px <= rect.x + rect.width + margin &&
    py >= rect.y - margin &&
    py <= rect.y + rect.height + margin
  );
}

/**
 * Cek apakah garis AB berpotongan dengan rectangle
 * Menggunakan algoritma Cohen-Sutherland yang lebih robust
 */
function lineIntersectsRect(
  x1: number, y1: number,
  x2: number, y2: number,
  rect: BoundingBox,
  margin: number = 12
): boolean {
  const left = rect.x - margin;
  const right = rect.x + rect.width + margin;
  const top = rect.y - margin;
  const bottom = rect.y + rect.height + margin;

  // Jika salah satu endpoint di dalam rect
  if (pointInRect(x1, y1, rect, margin) || pointInRect(x2, y2, rect, margin)) {
    return true;
  }

  // Cek perpotongan dengan setiap sisi rectangle
  return (
    lineSegmentIntersection(x1, y1, x2, y2, left, top, right, top) ||     // top
    lineSegmentIntersection(x1, y1, x2, y2, left, bottom, right, bottom) || // bottom
    lineSegmentIntersection(x1, y1, x2, y2, left, top, left, bottom) ||     // left
    lineSegmentIntersection(x1, y1, x2, y2, right, top, right, bottom)      // right
  );
}

/**
 * Cek perpotongan dua segmen garis
 */
function lineSegmentIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.00001) return false; // Parallel

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999;
}

/**
 * Hitung jarak Euclidean
 */
function distance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Hitung titik tengah
 */
function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

// =============================================
// WAYPOINT GENERATION
// =============================================

/**
 * Dapatkan 8 titik waypoint di sekitar obstacle:
 * - 4 corner points (dengan margin)
 * - 4 edge midpoints (dengan margin)
 */
function getWaypointsAroundObstacle(rect: BoundingBox, margin: number = 20): Point2D[] {
  const left = rect.x - margin;
  const right = rect.x + rect.width + margin;
  const top = rect.y - margin;
  const bottom = rect.y + rect.height + margin;
  const cx = rect.centerX;
  const cy = rect.centerY;

  return [
    // 4 Corner points
    { x: left, y: top },       // top-left
    { x: right, y: top },      // top-right
    { x: right, y: bottom },   // bottom-right
    { x: left, y: bottom },    // bottom-left
    
    // 4 Edge midpoints
    { x: cx, y: top },         // top-center
    { x: right, y: cy },       // right-center
    { x: cx, y: bottom },      // bottom-center
    { x: left, y: cy },        // left-center
  ];
}

/**
 * Cek apakah sebuah titik aman (tidak berada di dalam obstacle manapun)
 */
function isPointSafe(point: Point2D, obstacles: BoundingBox[], margin: number = 8): boolean {
  return !obstacles.some(obs => pointInRect(point.x, point.y, obs, margin));
}

/**
 * Cek apakah garis aman (tidak berpotongan dengan obstacle manapun)
 */
function isLineSafe(
  x1: number, y1: number,
  x2: number, y2: number,
  obstacles: BoundingBox[],
  margin: number = 10
): boolean {
  return !obstacles.some(obs => lineIntersectsRect(x1, y1, x2, y2, obs, margin));
}

// =============================================
// PATH FINDING (menghindari obstacle)
// =============================================

/**
 * Cari rute terpendek dari source ke target yang menghindari semua obstacle
 * 
 * Strategi:
 * 1. Coba koneksi langsung (jika aman)
 * 2. Coba via 1 waypoint (cari yang terpendek)
 * 3. Coba via 2 waypoint (untuk obstacle besar)
 * 4. Fallback: gunakan rute via corner terdekat
 */
function findSafePath(
  source: Point2D,
  target: Point2D,
  obstacles: BoundingBox[]
): { waypoints: Point2D[]; totalDistance: number } {
  
  // Jika tidak ada obstacle, return direct
  if (obstacles.length === 0) {
    return { waypoints: [source, target], totalDistance: distance(source, target) };
  }

  // Cek apakah direct line aman
  if (isLineSafe(source.x, source.y, target.x, target.y, obstacles)) {
    return { waypoints: [source, target], totalDistance: distance(source, target) };
  }

  // Kumpulkan semua waypoint dari semua obstacle
  const allWaypoints: Point2D[] = [];
  for (const obs of obstacles) {
    const waypoints = getWaypointsAroundObstacle(obs);
    allWaypoints.push(...waypoints);
  }

  // Filter waypoint yang aman (tidak di dalam obstacle)
  const safeWaypoints = allWaypoints.filter(wp => isPointSafe(wp, obstacles, 5));

  if (safeWaypoints.length === 0) {
    // Fallback: gunakan corner obstacle pertama dengan margin besar
    const fallbackWaypoints = getWaypointsAroundObstacle(obstacles[0], 40);
    const safeFallback = fallbackWaypoints.filter(wp => isPointSafe(wp, obstacles, 2));
    if (safeFallback.length >= 2) {
      return {
        waypoints: [source, safeFallback[0], safeFallback[1], target],
        totalDistance: distance(source, safeFallback[0]) + 
                       distance(safeFallback[0], safeFallback[1]) + 
                       distance(safeFallback[1], target),
      };
    }
    // Last resort
    return { waypoints: [source, target], totalDistance: distance(source, target) };
  }

  let bestWaypoints: Point2D[] = [source, target];
  let bestDistance = Infinity;

  // ===== COBA 1 WAYPOINT =====
  for (const wp of safeWaypoints) {
    // Cek source -> wp aman
    if (!isLineSafe(source.x, source.y, wp.x, wp.y, obstacles, 5)) continue;
    // Cek wp -> target aman
    if (!isLineSafe(wp.x, wp.y, target.x, target.y, obstacles, 5)) continue;

    const dist = distance(source, wp) + distance(wp, target);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestWaypoints = [source, wp, target];
    }
  }

  // Jika sudah ketemu rute 1 waypoint yang bagus, return
  if (bestDistance < Infinity && bestDistance <= distance(source, target) * 1.8) {
    return { waypoints: bestWaypoints, totalDistance: bestDistance };
  }

  // ===== COBA 2 WAYPOINTS =====
  for (let i = 0; i < safeWaypoints.length; i++) {
    for (let j = 0; j < safeWaypoints.length; j++) {
      if (i === j) continue;
      
      const wp1 = safeWaypoints[i];
      const wp2 = safeWaypoints[j];

      // Cek source -> wp1
      if (!isLineSafe(source.x, source.y, wp1.x, wp1.y, obstacles, 4)) continue;
      // Cek wp1 -> wp2
      if (!isLineSafe(wp1.x, wp1.y, wp2.x, wp2.y, obstacles, 4)) continue;
      // Cek wp2 -> target
      if (!isLineSafe(wp2.x, wp2.y, target.x, target.y, obstacles, 4)) continue;

      const dist = distance(source, wp1) + distance(wp1, wp2) + distance(wp2, target);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestWaypoints = [source, wp1, wp2, target];
      }
    }
  }

  return { waypoints: bestWaypoints, totalDistance: bestDistance };
}

// =============================================
// SVG PATH BUILDER
// =============================================

/**
 * Buat SVG path string dari waypoints
 * Menggunakan quadratic bezier curves untuk sudut yang smooth
 */
function buildSmoothPath(waypoints: Point2D[]): string {
  if (waypoints.length < 2) return '';
  
  if (waypoints.length === 2) {
    // Direct line
    return `M ${waypoints[0].x} ${waypoints[0].y} L ${waypoints[1].x} ${waypoints[1].y}`;
  }

  // Untuk path dengan waypoints, buat garis patah dengan sedikit radius di tikungan
  const parts: string[] = [];
  parts.push(`M ${waypoints[0].x} ${waypoints[0].y}`);

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];

    if (next) {
      // Ada titik berikutnya - buat tikungan halus
      // Gunakan jarak pendek untuk mendekati tikungan
      const distToNext = distance(curr, next);
      const bendDistance = Math.min(distToNext * 0.2, 15);
      
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;

      const bendPoint: Point2D = {
        x: curr.x - ux * bendDistance,
        y: curr.y - uy * bendDistance,
      };

      parts.push(`L ${bendPoint.x} ${bendPoint.y}`);
      parts.push(`Q ${curr.x} ${curr.y} ${curr.x + ux * bendDistance} ${curr.y + uy * bendDistance}`);
    } else {
      // Titik terakhir
      parts.push(`L ${curr.x} ${curr.y}`);
    }
  }

  return parts.join(' ');
}

// =============================================
// NODE BOUNDING BOX CALCULATOR
// =============================================

/**
 * Dapatkan bounding box akurat untuk setiap tipe node
 */
function getNodeBoundingBox(node: any): BoundingBox {
  let width = 220;
  let height = 140;

  switch (node.type) {
    case 'operatorNode':
      width = 180;
      height = 130;
      break;
    case 'shapeOperatorNode':
      width = (node.data?.chairDesign?.chairWidth || 80) + 10;
      height = (node.data?.chairDesign?.chairHeight || 100) + 40;
      break;
    case 'machineNode':
      width = 220;
      height = 140;
      break;
    case 'shapeMachineNode':
      const template = node.data?.template;
      if (template) {
        width = template.width || 200;
        height = template.height || 200;
      } else {
        width = 200;
        height = 200;
      }
      break;
    default:
      width = 200;
      height = 120;
  }

  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height,
    centerX: node.position.x + width / 2,
    centerY: node.position.y + height / 2,
    id: node.id,
    type: node.type || 'unknown',
  };
}

// =============================================
// MAIN COMPONENT
// =============================================

const SmartAvoidEdge = (props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style = {},
    markerEnd,
    data,
  } = props;

  // =============================================
  // COMPUTED VALUES (memoized)
  // =============================================
  
  const source: Point2D = useMemo(() => ({ x: sourceX, y: sourceY }), [sourceX, sourceY]);
  const target: Point2D = useMemo(() => ({ x: targetX, y: targetY }), [targetX, targetY]);

  const allNodes: any[] = useMemo(() => data?.allNodes || [], [data?.allNodes]);
  const sourceNodeId: string = useMemo(() => data?.sourceNodeId || '', [data?.sourceNodeId]);
  const targetNodeId: string = useMemo(() => data?.targetNodeId || '', [data?.targetNodeId]);

  // =============================================
  // DETEKSI OBSTACLE
  // =============================================
  
  const obstacles = useMemo(() => {
    const obs: BoundingBox[] = [];
    
    for (const node of allNodes) {
      // Skip source dan target node
      if (node.id === sourceNodeId || node.id === targetNodeId) {
        continue;
      }

      const bbox = getNodeBoundingBox(node);
      
      // Cek apakah garis lurus mengenai node ini
      if (lineIntersectsRect(sourceX, sourceY, targetX, targetY, bbox)) {
        obs.push(bbox);
      }
    }

    return obs;
  }, [sourceX, sourceY, targetX, targetY, allNodes, sourceNodeId, targetNodeId]);

  // =============================================
  // HITUNG PATH
  // =============================================
  
  const { edgePath, isAvoiding, pathInfo } = useMemo(() => {
    // Jika tidak ada obstacle, gunakan garis lurus
    if (obstacles.length === 0) {
      const [path] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      return { 
        edgePath: path, 
        isAvoiding: false,
        pathInfo: { waypoints: [source, target], totalDistance: distance(source, target) },
      };
    }

    // Cari rute aman
    const result = findSafePath(source, target, obstacles);
    
    if (result.waypoints.length <= 2) {
      // Direct path aman
      const [path] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      return { 
        edgePath: path, 
        isAvoiding: false,
        pathInfo: result,
      };
    }

    // Build path menghindar
    const path = buildSmoothPath(result.waypoints);
    
    return { 
      edgePath: path, 
      isAvoiding: true,
      pathInfo: result,
    };
  }, [source, target, obstacles, sourceX, sourceY, targetX, targetY]);

  // =============================================
  // STYLE
  // =============================================
  
  const isOperatorEdge = data?.operatorId !== undefined;
  const baseColor = (style.stroke as string) || (isOperatorEdge ? '#a855f7' : '#1e293b');
  
  const edgeStyle = {
    ...style,
    stroke: baseColor,
    strokeWidth: style.strokeWidth || 2,
    strokeDasharray: isOperatorEdge 
      ? '6,4' // Operator: selalu dash
      : isAvoiding 
        ? '8,4' // Menghindar: dash lebih panjang
        : (style.strokeDasharray as string) || 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  // =============================================
  // RENDER
  // =============================================
  
  return (
    <>
      {/* Garis utama */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd}
      />

      {/* Label informasi */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
            fontSize: 10,
            fontWeight: 600,
            color: baseColor,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2px 8px',
            borderRadius: '12px',
            border: `1px solid ${baseColor}40`,
            pointerEvents: 'all',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            whiteSpace: 'nowrap',
          }}
          className="nodrag nopan"
        >
          {/* Operator edge: tampilkan process */}
          {isOperatorEdge && data && (
            <span>
              P{data.sourceProcess} → P{data.targetProcess}
            </span>
          )}
          
          {/* Avoiding indicator */}
          {isAvoiding && (
            <span
              style={{
                marginLeft: isOperatorEdge ? '6px' : '0',
                fontSize: '9px',
                color: '#f59e0b',
                fontWeight: 500,
              }}
              title={`Menghindari ${obstacles.length} node · Jarak: ${pathInfo.totalDistance.toFixed(0)}px`}
            >
              {isOperatorEdge ? '↪' : `↪ ${obstacles.length} obstacle`}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>

      {/* Debug: Tampilkan waypoints saat development (optional - hapus jika tidak diperlukan) */}
      {/* {isAvoiding && process.env.NODE_ENV === 'development' && (
        <EdgeLabelRenderer>
          {pathInfo.waypoints.slice(1, -1).map((wp, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${wp.x}px, ${wp.y}px)`,
                width: 6,
                height: 6,
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                border: '1px solid white',
                pointerEvents: 'none',
              }}
            />
          ))}
        </EdgeLabelRenderer>
      )} */}
    </>
  );
};

export default React.memo(SmartAvoidEdge);