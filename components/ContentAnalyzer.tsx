
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { fileToBase64, fileToDataURL } from '../utils/fileUtils';
import { Loader } from './icons/Icons';

type InputMode = 'text' | 'image';
type Model = 'gemini-2.5-flash' | 'gemini-2.5-pro';

const ContentAnalyzer: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState<string>('This is a test of the emergency broadcast system. This is only a test.');
  const [prompt, setPrompt] = useState<string>('Summarize this text in one sentence.');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [model, setModel] = useState<Model>('gemini-2.5-flash');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setError(null);
    setResult('');
    setFile(null);
    setPreviewUrl(null);
    if (mode === 'text') {
      setPrompt('Summarize this text in one sentence.');
    } else {
      setPrompt('Describe this image in detail.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult('');
      setError(null);
      const url = await fileToDataURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleAnalyze = async () => {
    if (inputMode === 'text' && !textInput) {
      setError('Please enter some text to analyze.');
      return;
    }
    if (inputMode === 'image' && !file) {
      setError('Please upload an image to analyze.');
      return;
    }
    if (!prompt) {
      setError('Please enter a prompt to guide the analysis.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let contents: any;

      if (inputMode === 'image' && file) {
          const base64Image = await fileToBase64(file);
          const imagePart = {
              inlineData: {
                  mimeType: file.type,
                  data: base64Image,
              },
          };
          const textPart = { text: prompt };
          contents = { parts: [imagePart, textPart] };
      } else {
          // Text mode
          const fullPrompt = `${prompt}\n\n---\n\n${textInput}`
          contents = fullPrompt;
      }
      
      const response = await ai.models.generateContent({
        model,
        contents,
      });

      setResult(response.text);

    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Content Analyzer</h2>
      <div className="flex-grow space-y-4 flex flex-col">
        {/* Input section */}
        <div className="flex-grow space-y-4">
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button onClick={() => handleModeChange('text')} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${inputMode === 'text' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>
              Analyze Text
            </button>
            <button onClick={() => handleModeChange('image')} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${inputMode === 'image' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>
              Analyze Image
            </button>
          </div>
          
          {inputMode === 'text' ? (
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-gray-400 mb-1">Text Content</label>
              <textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste or type text here..."
                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                rows={6}
                disabled={loading}
              />
            </div>
          ) : (
             <div>
                <label htmlFor="file-upload-analyzer" className="block text-sm font-medium text-gray-400 mb-1">Upload Image</label>
                <input id="file-upload-analyzer" type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50" disabled={loading} />
                {previewUrl && <img src={previewUrl} alt="Preview" className="mt-4 rounded-lg max-h-40"/>}
             </div>
          )}
          
          <div>
            <label htmlFor="prompt-analyzer" className="block text-sm font-medium text-gray-400 mb-1">Analysis Prompt</label>
            <textarea
              id="prompt-analyzer"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What is the sentiment of this text?"
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
            <div className="flex gap-4">
               <label className="flex items-center">
                  <input type="radio" name="model" value="gemini-2.5-flash" checked={model === 'gemini-2.5-flash'} onChange={() => setModel('gemini-2.5-flash')} className="form-radio h-4 w-4 text-blue-600 bg-gray-700 border-gray-600" />
                  <span className="ml-2 text-white">Fast (Flash)</span>
               </label>
               <label className="flex items-center">
                  <input type="radio" name="model" value="gemini-2.5-pro" checked={model === 'gemini-2.5-pro'} onChange={() => setModel('gemini-2.5-pro')} className="form-radio h-4 w-4 text-blue-600 bg-gray-700 border-gray-600" />
                  <span className="ml-2 text-white">Advanced (Pro)</span>
               </label>
            </div>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors"
        >
          {loading ? <><Loader className="mr-2" /> Analyzing...</> : 'Analyze'}
        </button>

        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mt-4">{error}</div>}
      </div>

      {/* Result section */}
      <div className="mt-6 flex-grow flex flex-col bg-gray-900/50 rounded-lg p-4 min-h-[200px]">
        <h3 className="text-lg font-semibold mb-2 text-gray-400">Analysis Result</h3>
        <div className="flex-grow w-full overflow-y-auto pr-2">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader className="h-12 w-12 text-blue-500" />
                </div>
            ) : result ? (
                <pre className="whitespace-pre-wrap text-gray-200 font-sans">{result}</pre>
            ) : (
                <div className="text-center text-gray-500 h-full flex items-center justify-center">
                    <p>Your analysis result will appear here.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContentAnalyzer;
