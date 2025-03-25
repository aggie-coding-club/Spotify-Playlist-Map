import React, { useRef, memo, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Node, GraphData } from '../../types/reactForceGraphTypes';

interface GraphProps {
  graphData: GraphData;
  onNodeClick: (node: Node) => void;
}

const ForceGraph: React.FC<GraphProps> = memo(({ graphData, onNodeClick }) => {
  const fgRef = useRef<any>(null);

  // we have to memoize the canvas drawings to avoid re-rendering
  const nodeCanvasObject = useMemo(() => {
    return (node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const img = new Image();
      img.src = node.image ?? 'https://placehold.co/600x400';
      const size = 40 / globalScale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size / 2, 0, 2 * Math.PI, false);
      ctx.clip();
      ctx.drawImage(img, node.x! - size / 2, node.y! - size / 2, size, size);
      ctx.restore();
      ctx.font = `${12 / globalScale}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'black';
      ctx.fillText(node.label, node.x!, node.y! - size / 2 - 5);
    };
  }, []); // empty dependency array to only render once (i think)

  // memoize paint function too
  const nodePointerAreaPaint = useMemo(() => {
    return (node: Node, color: string, ctx: CanvasRenderingContext2D) => {
      const size = 40;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size / 2, 0, 2 * Math.PI, false);
      ctx.fill();
    };
  }, []);

  // memoize graph data - ONLY RE-RENDER if data changes
  const memoizedGraphData = useMemo(() => graphData, [
    graphData.nodes.length, 
    graphData.links.length
  ]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={memoizedGraphData}
      nodeLabel={(node: Node) => `${node.label}`}
      nodeAutoColorBy="id"
      linkWidth={2}
      enableNodeDrag={false}
      onNodeClick={onNodeClick}
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={nodePointerAreaPaint}
    />
  );
});

export default ForceGraph;