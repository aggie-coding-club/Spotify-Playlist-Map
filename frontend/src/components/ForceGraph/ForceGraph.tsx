import React, { useRef, memo, useMemo, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Node, GraphData } from '../../types/reactForceGraphTypes';
import { Box, Text, Paper, Stack, Title, Group, Image } from "@mantine/core";

interface GraphProps {
  graphData: GraphData;
  onNodeClick: (node: Node) => void;
  selectedNode: Node | null;
}

const ForceGraph: React.FC<GraphProps> = memo(({ graphData, onNodeClick, selectedNode }) => {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // resize on container change
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    
    // Initial measurement
    updateDimensions();
    
    // Create observer for dynamic updates
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // custom three.js object
  const nodeThreeObject = useMemo(() => {
    return (node: Node) => {
      const textureLoader = new THREE.TextureLoader();
      const imgTexture = textureLoader.load(node.image ?? 'https://placehold.co/600x400');
      imgTexture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.SpriteMaterial({ map: imgTexture });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(12, 12, 1);
      return sprite;
    };
  }, []);

  // node label
  const nodeThreeObjectExtend = useMemo(() => {
    return false; // return true IF u want to debug w/ default node rendering
  }, []);

  // memoization - only re-render IF data changes
  const memoizedGraphData = useMemo(() => graphData, [
    graphData.nodes.length,
    graphData.links.length
  ]);

  // render w/ above params
  return (
    <Box ref={containerRef} style={{ position: "relative", display: "inline-block", width: "100%", height: "100%" }}>
      {/* Album cover, song title, and artist name - now positioned relative to container (top left) */}
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

      {/* Music Details - positioned relative to container (bottom right) */}
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
          {/* add more fields as needed */}
        </Stack>
      </Paper>

      <ForceGraph3D
        ref={fgRef}
        graphData={memoizedGraphData}
        nodeLabel={(node: Node) => `${node.label}`}
        nodeAutoColorBy="id"
        linkWidth={1}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={nodeThreeObjectExtend}
        onNodeClick={onNodeClick}
        backgroundColor="#ffffff"
        width={dimensions.width || undefined}
        height={dimensions.height || undefined}
      />
    </Box>
  );
});

export default ForceGraph;