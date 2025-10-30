
import React, { useState } from 'react';
import { FeatureTab } from './types';
import TabButton from './components/TabButton';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import TextToSpeech from './components/TextToSpeech';
import ImageEditor from './components/ImageEditor';
import LiveChat from './components/LiveChat';
import ContentAnalyzer from './components/ContentAnalyzer';
import { Image, Video, Mic, Volume2, Edit3, Analyze } from './components/icons/Icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>(FeatureTab.IMAGE_GEN);

  const renderContent = () => {
    switch (activeTab) {
      case FeatureTab.IMAGE_GEN:
        return <ImageGenerator />;
      case FeatureTab.VIDEO_GEN:
        return <VideoGenerator />;
      case FeatureTab.TTS:
        return <TextToSpeech />;
      case FeatureTab.IMAGE_EDIT:
        return <ImageEditor />;
      case FeatureTab.LIVE_CHAT:
        return <LiveChat />;
      case FeatureTab.CONTENT_ANALYZER:
        return <ContentAnalyzer />;
      default:
        return <ImageGenerator />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg p-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Google AI Studio Suite
          </h1>
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 space-y-4 md:space-y-0 md:space-x-6">
        <nav className="w-full md:w-64 bg-gray-800 rounded-lg p-4 flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto">
          <TabButton
            label="Image Gen"
            icon={<Image />}
            isActive={activeTab === FeatureTab.IMAGE_GEN}
            onClick={() => setActiveTab(FeatureTab.IMAGE_GEN)}
          />
          <TabButton
            label="Video Gen"
            icon={<Video />}
            isActive={activeTab === FeatureTab.VIDEO_GEN}
            onClick={() => setActiveTab(FeatureTab.VIDEO_GEN)}
          />
           <TabButton
            label="Image Editor"
            icon={<Edit3 />}
            isActive={activeTab === FeatureTab.IMAGE_EDIT}
            onClick={() => setActiveTab(FeatureTab.IMAGE_EDIT)}
          />
          <TabButton
            label="Analyzer"
            icon={<Analyze />}
            isActive={activeTab === FeatureTab.CONTENT_ANALYZER}
            onClick={() => setActiveTab(FeatureTab.CONTENT_ANALYZER)}
          />
          <TabButton
            label="Text to Speech"
            icon={<Volume2 />}
            isActive={activeTab === FeatureTab.TTS}
            onClick={() => setActiveTab(FeatureTab.TTS)}
          />
          <TabButton
            label="Live Chat"
            icon={<Mic />}
            isActive={activeTab === FeatureTab.LIVE_CHAT}
            onClick={() => setActiveTab(FeatureTab.LIVE_CHAT)}
          />
        </nav>

        <main className="flex-grow bg-gray-800 rounded-lg p-6 w-full">
          {renderContent()}
        </main>
      </div>

       <footer className="text-center p-4 text-gray-500 text-sm">
          Powered by Gemini API
      </footer>
    </div>
  );
};

export default App;