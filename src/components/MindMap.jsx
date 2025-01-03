import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const flowStyles = {
  width: '100vw',
  height: '100vh',
  background: '#fafafa',
};

const MindMap = ({ nodes: initialNodes = [], edges: initialEdges = [] }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const onInit = useCallback((reactFlowInstance) => {
    console.log('Flow loaded:', reactFlowInstance);
    reactFlowInstance.fitView();
  }, []);

  return (
    <div style={flowStyles}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodeOrigin={[0.5, 0.5]}
        minZoom={0.2}
        maxZoom={2}
        fitViewOptions={{
          padding: 100,
          minZoom: 0.5,
          maxZoom: 1.2,
          duration: 800
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls 
          position="bottom-right" 
          showInteractive={false}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '5px',
            bottom: '70px', 
            right: '20px'   
          }}
        />
        <Background variant="dots" gap={12} size={1} color="#1a73e8" />
      </ReactFlow>
    </div>
  );
};

export default MindMap;
