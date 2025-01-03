import React, { useState } from 'react';
import MindMap from './components/MindMap';
import ModernHeader from './components/ModernHeader';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  const handleGenerate = async () => {
    try {
      const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Network response was not ok');
      }
      
      setNodes(data.flow.nodes);
      setEdges(data.flow.edges);
      setError('');
      setIsInputExpanded(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="app">
      <ModernHeader />
      <div className="mindmap-container">
        <div className={`input-section ${isInputExpanded ? 'expanded' : ''}`}>
          <button 
            className="toggle-button"
            onClick={() => setIsInputExpanded(!isInputExpanded)}
          >
            {isInputExpanded ? '▼ پنهان کردن' : '▲ نمایش ورودی'}
          </button>
          <div className="content">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="متن خود را اینجا وارد کنید..."
            />
            <button onClick={handleGenerate}>تولید نمودار</button>
            {error && <div className="error">{error}</div>}
          </div>
        </div>
        <MindMap nodes={nodes} edges={edges} />
      </div>
    </div>
  );
}

export default App;
