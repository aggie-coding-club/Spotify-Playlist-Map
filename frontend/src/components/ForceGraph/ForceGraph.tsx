import React, { useRef, memo, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Node, GraphData } from '../../types/reactForceGraphTypes';
import { Box, Text } from "@mantine/core"

interface GraphProps {
  graphData: GraphData;
  onNodeClick: (node: Node) => void;
}

const ForceGraph: React.FC<GraphProps> = memo(({ graphData, onNodeClick }) => {
  const fgRef = useRef<any>(null);

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
    <Box style={{ position: "relative", display: "inline-block" }}>
      <Text
        size="50"
        fw={700}
        style={{
          position: "absolute",
          top: 50,
          left: 50,
          padding: "4px 8px",
          borderRadius: "4px",
          zIndex: 10,
          lineHeight: 1,
        }}
      >
        Album cover, song title, and artist name go here
      </Text>

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
      />
    </Box>
  );
});

export default ForceGraph;