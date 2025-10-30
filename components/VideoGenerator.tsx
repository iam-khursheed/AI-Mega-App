import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AspectRatioVideo } from '../types';
import { fileToBase64, fileToDataURL } from '../utils/fileUtils';
import { Loader } from './icons/Icons';

const loadingMessages = [
  "Warming up the digital forge...",
  "Rendering pixels into motion...",
  "This can take a few minutes...",
  "Composing the cinematic sequence...",
  "Almost there, adding the final touches...",
];

type ResultItem = {
    file: File;
    previewUrl: string;
    videoUrl?: string;
    error?: string;
};

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Animate this image with a gentle zoom and flowing particles.');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioVideo>('16:9');
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
      const keySelected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(keySelected);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);
  
  useEffect(() => {
    let interval: number;
    if (loading) {
        interval = window.setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesFromInput = e.target.files;
    if (!filesFromInput || filesFromInput.length === 0) {
      return;
    }
    
    // FIX: Explicitly type `selectedFiles` as `File[]` to fix a type inference
    // issue where items in the array were being treated as `unknown`.
    const selectedFiles: File[] = Array.from(filesFromInput);
    
    setFiles(selectedFiles);
    setError(null);
    const previewPromises = selectedFiles.map(file => fileToDataURL(file));
    const urls = await Promise.all(previewPromises);
    setResults(selectedFiles.map((file, index) => ({
      file,
      previewUrl: urls[index],
    })));
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    setLoading(true);
    setError(null);
    setProgressMessage('');
    setLoadingMessage(loadingMessages[0]);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    for (const [index, resultItem] of results.entries()) {
        setProgressMessage(`Generating video ${index + 1} of ${files.length}...`);
        try {
            const base64Image = await fileToBase64(resultItem.file);
            
            let operation = await ai.models.generateVideos({
              model: 'veo-3.1-fast-generate-preview',
              prompt: prompt,
              image: {
                imageBytes: base64Image,
                mimeType: resultItem.file.type,
              },
              config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
              }
            });

            while (!operation.done) {
              await new Promise(resolve => setTimeout(resolve, 10000));
              operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

            if (downloadLink) {
              const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
              if (!videoResponse.ok) {
                  throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
              }
              const videoBlob = await videoResponse.blob();
              const videoUrl = URL.createObjectURL(videoBlob);
              setResults(prev => {
                  const newResults = [...prev];
                  newResults[index].videoUrl = videoUrl;
                  return newResults;
              });
            } else {
              throw new Error("Video generation completed, but no download link was provided.");
            }

        } catch (e: any) {
            console.error(`Error generating video for image ${index + 1}:`, e);
            const errorMessage = e.message || "An unknown error occurred.";
             setResults(prev => {
                  const newResults = [...prev];
                  newResults[index].error = errorMessage;
                  return newResults;
              });
            if (errorMessage.includes("Requested entity was not found")) {
                setHasApiKey(false);
                setError("API Key not found or invalid. Please select a valid API key. Batch process stopped.");
                break; 
            }
        }
    }

    setLoading(false);
    setProgressMessage('');
  };
  
  if (!hasApiKey) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold mb-4">API Key Required for Video Generation</h2>
            <p className="mb-6 text-gray-400 max-w-md">The Veo video model requires you to select a project with billing enabled. Please select your API key to continue.</p>
            <button onClick={handleSelectKey} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                Select API Key
            </button>
            <p className="mt-4 text-sm text-gray-500">For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">billing documentation</a>.</p>
            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mt-4">{error}</div>}
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Image-to-Video Creation (Batch Mode)</h2>
      <div className="flex-grow space-y-4 flex flex-col">
        <div className="flex-grow space-y-4">
            <div>
                 <label htmlFor="file-upload" className="block text-sm font-medium text-gray-400 mb-1">Upload Image(s)</label>
                 <input id="file-upload" type="file" accept="image/*" multiple onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50" disabled={loading} />
            </div>
            <div>
                <label htmlFor="prompt-video" className="block text-sm font-medium text-gray-400 mb-1">Prompt (applies to all images)</label>
                <textarea id="prompt-video" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the animation" className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 min-h-[70px]" rows={2} disabled={loading} />
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
                 <div className="flex gap-2">
                     {(['16:9', '9:16'] as AspectRatioVideo[]).map((ratio) => (
                        <button key={ratio} onClick={() => setAspectRatio(ratio)} disabled={loading} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${aspectRatio === ratio ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>
                             {ratio}
                        </button>
                     ))}
                 </div>
            </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || files.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors">
          {loading ? <><Loader className="mr-2" /> Generating...</> : `Generate ${files.length > 0 ? files.length : ''} Video(s)`}
        </button>

        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mt-4">{error}</div>}
      </div>

      <div className="mt-6 flex-grow bg-gray-900/50 rounded-lg p-4 min-h-[300px] overflow-y-auto">
        {loading && (
          <div className="text-center mb-4">
            <Loader className="mx-auto h-8 w-8 text-blue-500" />
            <p className="mt-2 text-gray-400">{progressMessage || loadingMessage}</p>
          </div>
        )}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <div key={index} className="bg-gray-800 p-2 rounded-lg flex flex-col">
                <div className="relative aspect-video">
                  {result.videoUrl ? (
                    <video src={result.videoUrl} controls autoPlay loop className="w-full h-full object-contain rounded-md" />
                  ) : (
                    <img src={result.previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-contain rounded-md" />
                  )}
                  {loading && !result.videoUrl && !result.error && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-md">
                      <Loader />
                    </div>
                  )}
                </div>
                {result.error && (
                    <div className="mt-2 text-red-400 bg-red-900/50 p-2 rounded-md text-xs">
                        <strong>Error:</strong> {result.error}
                    </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 flex items-center justify-center h-full">
            <div>
              <p>Upload one or more images to get started.</p>
              <p>Your generated videos will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;