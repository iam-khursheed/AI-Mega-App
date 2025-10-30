
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AspectRatioImage } from '../types';
import { Download, Loader } from './icons/Icons';

declare var JSZip: any;

const ImageGenerator: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [prompt, setPrompt] = useState<string>('A majestic lion in the savanna at sunset');
  const [style, setStyle] = useState<string>('Photorealistic');
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioImage>('16:9');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [progressMessage, setProgressMessage] = useState<string>('');

  const aspectRatios: AspectRatioImage[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const imageStyles = [
    'None',
    'Photorealistic',
    'Digital Art',
    'Anime',
    'Cinematic',
    'Fantasy',
    'Sci-fi',
    'Cyberpunk',
    'Steampunk',
    'Watercolor',
    'Oil Painting',
    'Sketch',
    '3D Model',
  ];

  const handleModeChange = (newMode: 'single' | 'batch') => {
    setMode(newMode);
    setImageUrls([]);
    setError(null);
    if (newMode === 'single') {
      setPrompt('A majestic lion in the savanna at sunset');
    } else {
      setPrompt('A tranquil zen garden in the morning mist\nA bustling cyberpunk city street at night\nA whimsical treehouse in an enchanted forest');
    }
  };
  
  const constructPrompt = (userPrompt: string) => {
      if (style === 'None') return userPrompt;
      return `${style}, ${userPrompt}`;
  }

  const handleDownloadAll = async () => {
    if (imageUrls.length < 2) return;

    const zip = new JSZip();
    imageUrls.forEach((url, index) => {
      const base64Data = url.split(',')[1];
      zip.file(`image_${index + 1}.png`, base64Data, { base64: true });
    });

    zip.generateAsync({ type: 'blob' }).then((content: any) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'generated_images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setLoading(true);
    setError(null);
    setImageUrls([]);
    setProgressMessage('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      if (mode === 'single') {
        const finalPrompt = constructPrompt(prompt);
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: finalPrompt,
          config: {
            numberOfImages: numberOfImages,
            outputMimeType: 'image/png',
            aspectRatio,
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const urls = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
          setImageUrls(urls);
        } else {
          setError('Image generation failed. No images were returned.');
        }
      } else { // Batch mode
        const prompts = prompt.split('\n').filter(p => p.trim() !== '');
        if (prompts.length === 0) {
          setError('Please enter at least one prompt in the script.');
          setLoading(false);
          return;
        }

        const allGeneratedUrls: string[] = [];
        for (const [index, p] of prompts.entries()) {
          setProgressMessage(`Generating image ${index + 1} of ${prompts.length}...`);
          try {
            const finalPrompt = constructPrompt(p);
            const response = await ai.models.generateImages({
              model: 'imagen-4.0-generate-001',
              prompt: finalPrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio,
              },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
              const base64ImageBytes = response.generatedImages[0].image.imageBytes;
              const url = `data:image/png;base64,${base64ImageBytes}`;
              allGeneratedUrls.push(url);
              setImageUrls([...allGeneratedUrls]); // Progressive update
            } else {
              console.warn(`No image generated for prompt: "${p}"`);
            }
          } catch (e: any) {
            setError(`An error occurred on prompt ${index + 1} ("${p.substring(0, 20)}..."): ${e.message}. Batch stopped.`);
            console.error(e);
            break; // Stop the batch on error
          }
        }
      }
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
      setProgressMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-100">Text-to-Image Generation</h2>
         {mode === 'batch' && imageUrls.length > 1 && !loading && (
          <button
            onClick={handleDownloadAll}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors text-sm"
          >
            <Download />
            <span className="ml-2">Download All (ZIP)</span>
          </button>
        )}
      </div>

      <div className="flex-grow space-y-4 flex flex-col">
        <div className="flex-grow space-y-4">
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button onClick={() => handleModeChange('single')} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'single' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>
              Single Prompt
            </button>
            <button onClick={() => handleModeChange('batch')} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'batch' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>
              Batch from Script
            </button>
          </div>
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-1">{mode === 'single' ? 'Prompt' : 'Script (one prompt per line)'}</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'single' ? 'e.g., A futuristic city skyline at dusk' : 'e.g., A majestic dragon flying over a castle\nA serene forest with a glowing river'}
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
              rows={mode === 'single' ? 3 : 5}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="style-select" className="block text-sm font-medium text-gray-400 mb-1">Style</label>
            <select
              id="style-select"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
            >
              {imageStyles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {mode === 'single' && (
             <div>
                <label htmlFor="num-images" className="block text-sm font-medium text-gray-400 mb-1">Number of Images: <span className="font-bold text-white">{numberOfImages}</span></label>
                <input
                    id="num-images"
                    type="range"
                    value={numberOfImages}
                    onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                    min="1"
                    max="4"
                    step="1"
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    disabled={loading}
                />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  disabled={loading}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    aspectRatio === ratio
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors"
        >
          {loading ? <><Loader className="mr-2" /> Generating...</> : 'Generate Image(s)'}
        </button>

        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mt-4">{error}</div>}
      </div>

      <div className="mt-6 flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg p-4 min-h-[300px]">
        {loading ? (
          <div className="text-center">
             <Loader className="mx-auto h-12 w-12 text-blue-500" />
            <p className="mt-4 text-gray-400">{progressMessage || 'Generating your masterpiece(s)...'}</p>
          </div>
        ) : imageUrls.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full overflow-y-auto pr-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt={`Generated image ${index + 1}`} className="w-full h-auto rounded-lg shadow-lg" />
                <a
                  href={url}
                  download={`generated-image-${index + 1}.png`}
                  className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Download image"
                >
                  <Download />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p>Your generated image(s) will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;