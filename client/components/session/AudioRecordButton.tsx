"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../shared/html/Button";
import { Duration } from "@/lib/util/time";

export default function AudioRecordButton({
  maxDuration,
  onAudio,
  onError,
}: {
  maxDuration?: Duration;
  onAudio?: (audio: Blob) => void;
  onError?: (error: any) => void;
}) {
  const recorderRef = useRef<MediaRecorder | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const [ready, setReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        recorderRef.current = new MediaRecorder(stream);
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!recorderRef.current) {
      return;
    }
    const recorder = recorderRef.current;
    var chunks: Blob[] = [];

    function handleStart() {
      chunks = [];
    }

    function handleDataAvailable(e: BlobEvent) {
      chunks.push(e.data);
    }

    function handleStop() {
      const audio = new Blob(chunks, { type: recorder.mimeType });
      onAudio?.(audio);
    }

    function handleError(e: ErrorEvent) {
      onError?.(e.error);
    }

    recorder.addEventListener("start", handleStart);
    recorder.addEventListener("dataavailable", handleDataAvailable);
    recorder.addEventListener("stop", handleStop);
    recorder.addEventListener("error", handleError);
    return () => {
      recorder.removeEventListener("start", handleStart);
      recorder.removeEventListener("dataavailable", handleDataAvailable);
      recorder.removeEventListener("stop", handleStop);
      recorder.removeEventListener("error", handleError);
    };
  }, [recorderRef.current]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !recorderRef.current) {
      return;
    }
    recorderRef.current.stop();
    setIsRecording(false);
  }, [isRecording, recorderRef.current]);

  const startRecording = useCallback(() => {
    if (isRecording || !recorderRef.current) {
      return;
    }
    recorderRef.current.start();
    setIsRecording(true);
    if (maxDuration !== undefined) {
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, maxDuration.milliseconds());
    }
  }, [isRecording, recorderRef.current, maxDuration]);

  return (
    <Button
      text={isRecording ? "Stop" : "Record"}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={!ready}
      primary
    />
  );
}
