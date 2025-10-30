
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64, fileToDataURL } from '../utils/fileUtils';
import { Download, Loader } from './icons/Icons';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Add a dramatic, cinematic lighting effect.');
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setEditedUrl(null);
      setError(null);
      const url = await fileToDataURL(selectedFile);
      setOriginalUrl(url);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please upload an image.');
      return;
    }
    if (!prompt) {
      setError('Please enter an editing prompt.');
      return;
    }
    setLoading(true);
    setError(null);
    setEditedUrl(null);

    try {
      const base64Image = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: file.type,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      
      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        setEditedUrl(`data:image/png;base64,${base64ImageBytes}`);
      } else {
         setError('Image editing failed. No edited image was returned.');
      }
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">AI Image Editor</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="file-upload-editor" className="block text-sm font-medium text-gray-400 mb-1">1. Upload Image</label>
          <input id="file-upload-editor" type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50" disabled={loading} />
        </div>
        <div>
          <label htmlFor="prompt-editor" className="block text-sm font-medium text-gray-400 mb-1">2. Describe Your Edit</label>
          <textarea id="prompt-editor" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Make this look like a vintage photograph" className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500" rows={2} disabled={loading} />
        </div>
        <button onClick={handleGenerate} disabled={loading || !file} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors">
          {loading ? <><Loader className="mr-2" /> Applying Edit...</> : 'Generate Edit'}
        </button>
        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mt-2">{error}</div>}
      </div>

      <div className="mt-6 flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-2 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2 text-gray-400">Original</h3>
          <div className="flex-grow w-full flex items-center justify-center">
            {originalUrl ? <img src={originalUrl} alt="Original" className="max-w-full max-h-80 rounded-md" /> : <p className="text-gray-500">Upload an image</p>}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-2 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2 text-gray-400">Edited</h3>
           <div className="flex-grow w-full flex items-center justify-center">
            {loading ? <Loader className="h-12 w-12 text-blue-500"/> : editedUrl ? (
                 <div className="relative group">
                    <img src={editedUrl} alt="Edited" className="max-w-full max-h-80 rounded-md" />
                     <a href={editedUrl} download="edited-image.png" className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Download edited image">
                        <Download />
                    </a>
                 </div>
            ) : <p className="text-gray-500">Your edited image will appear here</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
