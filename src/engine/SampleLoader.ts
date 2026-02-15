/**
 * Sample loader utility for loading audio files
 */

export interface LoadedSample {
  name: string;
  buffer: AudioBuffer;
  url: string;
}

/**
 * Load an audio file and return an AudioBuffer
 */
export async function loadAudioFile(file: File): Promise<LoadedSample> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        
        resolve({
          name: file.name,
          buffer,
          url: URL.createObjectURL(file),
        });
      } catch (error) {
        reject(new Error(`Failed to decode audio file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Load audio from URL
 */
export async function loadAudioFromURL(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Extract waveform data from AudioBuffer for visualization
 */
export function extractWaveformData(
  buffer: AudioBuffer,
  samples: number = 1000
): number[] {
  const rawData = buffer.getChannelData(0); // Use first channel
  const blockSize = Math.floor(rawData.length / samples);
  const waveformData: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const start = blockSize * i;
    let sum = 0;
    
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j]);
    }
    
    waveformData.push(sum / blockSize);
  }
  
  return waveformData;
}
