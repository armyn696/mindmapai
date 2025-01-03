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
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Sending request to Netlify function...');
      const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });
      
      console.log('Response received:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Network response was not ok');
      }
      
      if (!data.flow || !data.flow.nodes || !data.flow.edges) {
        throw new Error('Invalid response format from server');
      }
      
      setNodes(data.flow.nodes);
      setEdges(data.flow.edges);
      setError('');
      setIsInputExpanded(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
            />
            <button 
              onClick={handleGenerate} 
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? 'در حال پردازش...' : 'تولید نمودار'}
            </button>
            {error && (
              <div className="error">
                <p>خطا: {error}</p>
                <details>
                  <summary>جزئیات بیشتر</summary>
                  <pre>{JSON.stringify(error, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        </div>
        <MindMap nodes={nodes} edges={edges} />
      </div>
    </div>
  );
}

export default App;
