
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { TtsVoice } from '../types';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { Loader } from './icons/Icons';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>('Hello, this is a demonstration of the Gemini text-to-speech capabilities.');
  const [voice, setVoice] = useState<TtsVoice>('Kore');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const voices: TtsVoice[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  const handleGenerate = async () => {
    if (!text) {
      setError('Please enter some text.');
      return;
    }
    setLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this with a neutral tone: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        const audioBytes = decode(base64Audio);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
        
        // Convert AudioBuffer to a WAV Blob URL
        const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);

      } else {
        setError('Audio generation failed. No audio data was returned.');
      }
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert AudioBuffer to a WAV file Blob
  const bufferToWave = (abuffer: AudioBuffer, len: number) => {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;
  
    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"
  
    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit
  
    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length
  
    // write interleaved data
    for(i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));
  
    while(pos < length) {
      for(i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true);          // write 16-bit sample
        pos += 2;
      }
      offset++                                     // next source sample
    }
  
    return new Blob([view], {type: 'audio/wav'});
  
    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
  
    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }


  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Text to Speech</h2>
      <div className="flex-grow space-y-4 flex flex-col">
        <div className="flex-grow space-y-4">
          <div>
            <label htmlFor="tts-text" className="block text-sm font-medium text-gray-400 mb-1">Text</label>
            <textarea
              id="tts-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to synthesize..."
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              rows={4}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-400 mb-1">Voice</label>
            <select
              id="voice-select"
              value={voice}
              onChange={(e) => setVoice(e.target.value as TtsVoice)}
              disabled={loading}
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
            >
              {voices.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors"
        >
          {loading ? <><Loader className="mr-2" /> Generating...</> : 'Generate Speech'}
        </button>

        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mt-4">{error}</div>}
      </div>

      <div className="mt-6 flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg p-4 min-h-[150px]">
        {loading ? (
          <div className="text-center">
             <Loader className="mx-auto h-12 w-12 text-blue-500" />
            <p className="mt-4 text-gray-400">Synthesizing audio...</p>
          </div>
        ) : audioUrl ? (
          <div className="w-full">
            <audio src={audioUrl} controls className="w-full" />
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p>Your generated audio will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextToSpeech;
