import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide } from 'd3-force'; 

type SongNode = {
  id: string;
  title: string;
  artist: string;
  albumCover: string;
  x?: number;
  y?: number;
};

type SongLink = {
  source: string;
  target: string;
  distance: number;
};

interface MusicMapProps {
  nodes: SongNode[];
  links: SongLink[];
}

export const MusicMap: React.FC<MusicMapProps> = ({ nodes, links }) => {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });

  // Calculate and update dimensions
  const updateDimensions = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Subtract margins from the width calculation
      setDimensions({
        width: (rect.width - 48) * 0.8, // 48px = 3rem (2rem for outer margins + 1rem for inner margin)
        height: rect.height - 32 // 32px = 2rem (1rem top + 1rem bottom)
      });
    }
  };

  // Initial dimension calculation and resize handler
  useEffect(() => {
    updateDimensions();
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload album cover images
  useEffect(() => {
    const cache: Record<string, HTMLImageElement> = {};
    nodes.forEach(node => {
      const img = new Image();
      img.src = node.albumCover;
      cache[node.id] = img;
    });
    setImageCache(cache);
  }, [nodes]);

  // Set link distances + prevents collisions
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('link').distance((link: SongLink) => link.distance);
      const COLLISION_RADIUS = 100; 
      fgRef.current.d3Force('collision', forceCollide().radius(COLLISION_RADIUS));
    }
  }, [nodes, links]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%',
        height: 'calc(100vh - var(--mantine-header-height, 60px))',
        backgroundColor: '#DDDDDD', 
        padding: '1rem',
        display: 'flex',
        gap: '1rem', // margin between map and details
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ 
        width: '80%', 
        height: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          ref={fgRef}
          graphData={{ nodes, links }}
          nodeLabel={(node: SongNode) => `${node.title} by ${node.artist}`}
          nodeAutoColorBy="id"
          linkWidth={2}
          enableNodeDrag={false}
          nodeCanvasObject={(node: SongNode, ctx, globalScale) => {
            const img = imageCache[node.id];
            if (!img) return; 

            const size = 40 / globalScale; 
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, size / 2, 0, 2 * Math.PI, false); 
            ctx.clip();
            ctx.drawImage(img, node.x! - size / 2, node.y! - size / 2, size, size);
            ctx.restore();

            // Song title above the node
            ctx.font = `${12 / globalScale}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.fillText(node.title, node.x!, node.y! - size / 2 - 5);
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const size = 40;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, size / 2, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
        />
      </div>
      <div style={{ 
        width: '20%', 
        height: '100%',
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          Music Details
        </h2>
        <p>todo: fix bottom margin</p>
        <p>split this seciton into music detials and music player</p>
        {/* Add more components here */}
      </div>
    </div>
  );
};