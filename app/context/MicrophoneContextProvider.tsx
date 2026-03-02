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
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        const audioTrack = displayStream.getAudioTracks()[0];
        if (!audioTrack) {
          alert("🚨 抓取失败！请务必在弹窗中勾选【分享标签页中的音频】！");
          displayStream.getTracks().forEach(track => track.stop());
          setMicrophoneState(MicrophoneState.Error);
          return;
        }

        mediaStream = new MediaStream([audioTrack]);
        displayStream.getVideoTracks().forEach(track => track.stop());

      } else {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
          },
        });
      }

      const recorder = new MediaRecorder(mediaStream);
      setMicrophone(recorder);
      setMicrophoneState(MicrophoneState.Ready);
    } catch (err: any) {
      console.error("麦克风初始化失败:", err);
      setMicrophoneState(MicrophoneState.Error);
    }
  };

  const stopMicrophone = useCallback(() => {
    if (!microphone) return;
    setMicrophoneState(MicrophoneState.Pausing);

    if (microphone.state === "recording") {
      microphone.pause();
      setMicrophoneState(MicrophoneState.Paused);
    }
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    if (!microphone) return;

    try {
      // 🚀 终极防御：如果已经在录音了，直接无视并退出，彻底消灭报错！
      if (microphone.state === "recording") {
        setMicrophoneState(MicrophoneState.Open);
        return;
      }

      setMicrophoneState(MicrophoneState.Opening);

      if (microphone.state === "paused") {
        microphone.resume();
      } else if (microphone.state === "inactive") {
        microphone.start(250);
      }

      setMicrophoneState(MicrophoneState.Open);
    } catch (error) {
      console.warn("已安全拦截重复启动麦克风的指令:", error);
    }
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
