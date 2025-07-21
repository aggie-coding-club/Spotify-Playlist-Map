import React, { useRef, memo, useMemo, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Node, GraphData } from '../../types/reactForceGraphTypes';
import { Box, Text, Paper, Stack, Title, Group, Image } from "@mantine/core";
import SpriteText from 'three-spritetext';

interface GraphProps {
  graphData: GraphData;
  onNodeClick: (node: Node) => void;
  selectedNode: Node | null;
}

// Create singleton texture loaders to be reused
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');
const textureCache = new Map();

// Pre-load the glow texture once
const glowTexture = textureLoader.load(
  'https://threejs.org/examples/textures/sprites/glow.png'
);

const ForceGraph: React.FC<GraphProps> = memo(({ graphData, onNodeClick, selectedNode }) => {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [glowSize, setGlowSize] = useState(24); // Configurable glow size for testing

  // Handle resize with RAF for better performance
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (Math.abs(dimensions.width - width) > 5 || Math.abs(dimensions.height - height) > 5) {
        setDimensions({ width, height });
      }
    };

    // Initial size
    updateDimensions();

    // More efficient resize observer
    let rafId: number;
    let resizeTimeout: number;
    
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      
      resizeTimeout = window.setTimeout(() => {
        rafId = requestAnimationFrame(updateDimensions);
      }, 100);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // More efficient graph data memoization using stable references
  const memoizedGraphData = useMemo(() => {
    return {
      nodes: graphData.nodes.map(node => ({ ...node })),
      links: graphData.links.map(link => ({ ...link }))
    };
  }, [graphData]);

  // Engine configuration to improve performance
  const engineConfig = useMemo(() => {
    return {
      alphaDecay: 0.02, // faster convergence
      velocityDecay: 0.4,
      warmupTicks: 100,
      cooldownTicks: 100
    };
  }, []);

  const nodeThreeObject = useMemo(() => {
    return (node: Node) => {
      const url = node.image ?? 'https://placehold.co/300x300?text=?';
  
      if (!textureCache.has(url)) {
        const texture = textureLoader.load(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(url, texture);
      }
  
      const texture = textureCache.get(url);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(12, 12, 1); // same size for all nodes
  
      // Add soft yellow glow for recommendation nodes
      if (node.metadata?.group === 'recommendation') {
        const glowMaterial = new THREE.SpriteMaterial({
          map: glowTexture,
          color: new THREE.Color('#FFDE59'),
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
      
        const glowSprite = new THREE.Sprite(glowMaterial);
        glowSprite.scale.set(glowSize, glowSize, 1);
        glowSprite.position.z = -0.01; 
        sprite.add(glowSprite);
      }
      
  
      // Label
      if (node.label) {
        const textSprite = new SpriteText(node.label);
        textSprite.color = '#000000';
        textSprite.textHeight = 0.5;
        textSprite.position.y = -7;
        textSprite.backgroundColor = 'transparent';
        textSprite.padding = 1;
        textSprite.fontWeight = '400';
        sprite.add(textSprite);
      }
  
      return sprite;
    };
  }, [glowSize]);
  

  // Callback to handle after-render engine customization
  useEffect(() => {
    if (fgRef.current) {
      // Adjust camera distance for better visibility
      fgRef.current.cameraPosition({ z: 200 });
      
      // Force engine settings
      const forceEngine = fgRef.current.d3Force('charge');
      if (forceEngine) {
        forceEngine.distanceMax(300);
        forceEngine.strength(-120);
      }
    }
  }, []);

  // Key controls for adjusting glow size during testing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Plus key to increase glow size
      if (event.key === '+' || event.key === '=') {
        setGlowSize(prev => prev + 2);
      }
      // Minus key to decrease glow size
      else if (event.key === '-' || event.key === '_') {
        setGlowSize(prev => Math.max(4, prev - 2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Box ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Album cover, song title, and artist name */}
      <Paper
        shadow="md"
        radius="md"
        p="sm"
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          display: "inline-flex",
          minWidth: "200px",
        }}
      >
        {selectedNode ? (
          <Group gap="md">
            <Image
              src={selectedNode.image || 'https://placehold.co/600x400'}
              alt={selectedNode.label || 'Album Cover'}
              width={60}
              height={60}
              radius="md"
            />
            <Stack gap={2}>
              <Text fw={700} size="md">{selectedNode.label || 'Select a Song'}</Text>
              <Text size="sm" c="dimmed">{selectedNode.metadata?.artist || 'Artist'}</Text>
            </Stack>
          </Group>
        ) : (
          <Text fw={500} size="sm">Select a node to see song details</Text>
        )}
      </Paper>

      {/* Music Details */}
      <Paper
        shadow="lg"
        radius="lg"
        p="md"
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 280,
          zIndex: 10,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
        }}
      >
        <Title order={5} mb="md">
          Music Details
        </Title>
        <Stack gap="xs">
          <div>
            <Text fw={500} size="sm">
              Selected Song
            </Text>
            <Text size="sm" c="dimmed">
              {selectedNode?.label ?? 'Click a node!'}
            </Text>
          </div>
          <div>
            <Text fw={500} size="sm">
              Artists
            </Text>
            <Text size="sm" c="dimmed">
              {selectedNode?.metadata?.artist ?? '-'}
            </Text>
          </div>
          <div>
            <Text fw={500} size="sm">
              Genre
            </Text>
            <Text size="sm" c="dimmed">
              {selectedNode?.metadata?.genre ?? '-'}
            </Text>
          </div>
          <div>
            <Text fw={500} size="sm">
              Type
            </Text>
            <Text size="sm" c="dimmed">
              {selectedNode?.metadata?.group === 'recommendation' ? 'Recommendation' : 'Playlist Track'}
            </Text>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div>
              <Text fw={500} size="sm">
                Glow Size: {glowSize} (Use + and - keys to adjust)
              </Text>
            </div>
          )}
        </Stack>
      </Paper>

      <ForceGraph3D
        ref={fgRef}
        graphData={memoizedGraphData}
        nodeLabel={(node: Node) => `${node.label}`}
        nodeAutoColorBy="id"
        linkWidth={1}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        onNodeClick={onNodeClick}
        backgroundColor="#ffffff"
        width={dimensions.width}
        height={dimensions.height}
        showNavInfo={false}
        {...engineConfig}
      />
    </Box>
  );
});

export default ForceGraph;