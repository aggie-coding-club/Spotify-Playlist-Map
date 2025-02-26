// Types to be used in MusicMap.tsx with react-force-graph

export type Node = {
  id: string;
  label: string;
  size?: number;
  image?: string;                   // should be a URL to album cover
  metadata?: Record<string, any>;   // this should be like additional song details
  x?: number;
  y?: number;

};

export type Link = {
  source: string;
  target: string;
  weight?: number;                  // should represent how similar songs are to each other
}

export type GraphData = {           // this is ultimately the final type used to generate graph
  nodes: Node[];
  links: Link[]
};





export type NodeCluster = {         // EXPERIMENTAL IDEA: group nodes together + label them by genre?
  nodes: Node[];
  label: string;
  weight: number;
};