"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";

interface MicrophoneContextType {
  microphone: MediaRecorder | null;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  setupMicrophone: () => void;
  microphoneState: MicrophoneState | null;
}

export enum MicrophoneEvents {
  DataAvailable = "dataavailable",
  Error = "error",
  Pause = "pause",
  Resume = "resume",
  Start = "start",
  Stop = "stop",
}

export enum MicrophoneState {
  NotSetup = -1,
  SettingUp = 0,
  Ready = 1,
  Opening = 2,
  Open = 3,
  Error = 4,
  Pausing = 5,
  Paused = 6,
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(
  undefined
);

interface MicrophoneContextProviderProps {
  children: ReactNode;
}

const MicrophoneContextProvider: React.FC<MicrophoneContextProviderProps> = ({
  children,
}) => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup
  );
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);

const setupMicrophone = async () => {
    setMicrophoneState(MicrophoneState.SettingUp);

    try {
      let mediaStream;
      const audioSource = localStorage.getItem("LecSync_AudioSource") || 'mic';

      if (audioSource === 'system') {
        // 🚀 模式 B：系统内录 (捕获当前网页或系统的声音)
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true, // 必须请求视频，否则不弹框
          audio: true  // 关键：请求音频
        });
        
        const audioTrack = displayStream.getAudioTracks()[0];
        if (!audioTrack) {
          alert("🚨 抓取失败！请务必在弹窗中勾选【分享标签页中的音频】！");
          displayStream.getTracks().forEach(track => track.stop());
          setMicrophoneState(MicrophoneState.Error);
          return;
        }

        // 提取音频轨道，立刻关闭视频轨道以节省性能
        mediaStream = new MediaStream([audioTrack]);
        displayStream.getVideoTracks().forEach(track => track.stop());

      } else {
        // 🎙️ 模式 A：普通麦克风录音
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
          },
        });
      }

      const microphone = new MediaRecorder(mediaStream);
      setMicrophone(microphone);
      setMicrophoneState(MicrophoneState.Ready);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const stopMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Pausing);

    if (microphone?.state === "recording") {
      microphone.pause();
      setMicrophoneState(MicrophoneState.Paused);
    }
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Opening);

if (microphone.state === "paused") {
      microphone.resume();
    } else if (microphone.state === "inactive") {
      // 只有在麦克风彻底闲置 (inactive) 的时候，才允许调用 start
      microphone?.start(250);
    }

    setMicrophoneState(MicrophoneState.Open);
  }, [microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext);

  if (context === undefined) {
    throw new Error(
      "useMicrophone must be used within a MicrophoneContextProvider"
    );
  }

  return context;
}

export { MicrophoneContextProvider, useMicrophone };
