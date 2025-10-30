
export enum FeatureTab {
  IMAGE_GEN = 'image_gen',
  VIDEO_GEN = 'video_gen',
  TTS = 'tts',
  IMAGE_EDIT = 'image_edit',
  LIVE_CHAT = 'live_chat',
  CONTENT_ANALYZER = 'content_analyzer',
}

export type AspectRatioImage = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type AspectRatioVideo = "16:9" | "9:16";

export type TtsVoice = "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";