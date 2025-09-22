'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    Camera,
    CheckCircle,
    Clock,
    Pause,
    Play,
    RotateCcw,
    Square,
    Video
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

interface VideoState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  hasRecording: boolean;
  isPlaying: boolean;
  error?: string;
}


// Complete type definitions
interface Question {
  id: string;
  text: string;
  type: string;
  required?: boolean;
  description?: string;
  helpText?: string;
  options?: any[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
  };
}

interface ExtendedQuestionComponentProps {
  question: Question;
  value: any;
  onChange?: (value: any) => void;
  error?: string;
  preview?: boolean;
  disabled?: boolean;
}

export const VideoResponseQuestion: React.FC<ExtendedQuestionComponentProps> = ({
  question,
  onChange,
  error,
  disabled,
  preview
}) => {
  const [videoState, setVideoState] = useState<VideoState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    hasRecording: false,
    isPlaying: false
  });
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDuration = (question as any).sliderConfig?.max || 300; // 5 minutes default
  const minDuration = (question as any).sliderConfig?.min || 5; // 5 seconds minimum

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMediaStream(stream);
      setPermissionState('granted');
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      console.error('Permission denied or error:', err);
      setPermissionState('denied');
      setVideoState(prev => ({
        ...prev,
        error: 'Camera and microphone permissions are required to record video.'
      }));
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || preview) return;
    
    let stream = mediaStream;
    if (!stream) {
      stream = await requestPermissions();
      if (!stream) return;
    }

    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      });

      mediaRecorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mediaRecorder.mimeType
        });
        
        // Update value with video data
        onChange?.({
          videoBlob: blob,
          duration: videoState.recordingTime,
          mimeType: mediaRecorder.mimeType,
          recordedAt: new Date().toISOString()
        });

        setVideoState(prev => ({
          ...prev,
          hasRecording: true,
          isRecording: false,
          isPaused: false
        }));

        // Create URL for playback
        if (playbackRef.current) {
          playbackRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      setVideoState(prev => {
        const { error, ...rest } = prev;
        return {
          ...rest,
          isRecording: true,
          isPaused: false,
          recordingTime: 0
        };
      });

      // Start timer
      timerRef.current = setInterval(() => {
        setVideoState(prev => {
          const newTime = prev.recordingTime + 1;
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording();
            return { ...prev, recordingTime: maxDuration };
          }
          return { ...prev, recordingTime: newTime };
        });
      }, 1000);
    } catch (err: any) {
      console.error('Recording error:', err);
      setVideoState(prev => ({
        ...prev,
        error: 'Failed to start recording. Please try again.'
      }));
    }
  }, [
    disabled,
    preview,
    mediaStream,
    maxDuration,
    onChange,
    requestPermissions,
    videoState.recordingTime
  ]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && videoState.isRecording) {
      mediaRecorderRef.current.pause();
      setVideoState(prev => ({ ...prev, isPaused: true }));
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [videoState.isRecording]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && videoState.isPaused) {
      mediaRecorderRef.current.resume();
      setVideoState(prev => ({ ...prev, isPaused: false }));
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setVideoState(prev => {
          const newTime = prev.recordingTime + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return { ...prev, recordingTime: maxDuration };
          }
          return { ...prev, recordingTime: newTime };
        });
      }, 1000);
    }
  }, [maxDuration, videoState.isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (disabled || preview) return;
    
    stopRecording();
    setVideoState({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      hasRecording: false,
      isPlaying: false
    });
    recordedChunksRef.current = [];
    onChange?.(null);
    if (playbackRef.current) {
      playbackRef.current.src = '';
    }
  }, [disabled, preview, onChange, stopRecording]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // Initialize permissions on mount
  React.useEffect(() => {
    if (!disabled && !preview) {
      requestPermissions();
    }
  }, [disabled, preview, requestPermissions]);

  const canStartRecording = permissionState === 'granted' && !disabled && !preview;
  const isRecordingValid = videoState.hasRecording && videoState.recordingTime >= minDuration;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {question.text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {question.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{question.description}</p>
        )}
      </div>

      {/* Recording Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <div className="flex items-start space-x-3">
          <Video className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="text-blue-900 dark:text-blue-100">
              <strong>Recording Requirements:</strong>
            </p>
            <ul className="text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Minimum duration: {formatTime(minDuration)}</li>
              <li>• Maximum duration: {formatTime(maxDuration)}</li>
              <li>• Camera and microphone access required</li>
              <li>• Supported formats: WebM, MP4</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Permission Status */}
      {permissionState === 'denied' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-red-900 dark:text-red-100 font-medium">Permission Required</p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Please allow camera and microphone access to record your video response.
              </p>
              <button
                onClick={() => requestPermissions()}
                className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Video Interface */}
      {permissionState === 'granted' && (
        <div className="space-y-4">
          {/* Preview/Playback Container */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {/* Live Preview */}
            {!videoState.hasRecording && (
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            {/* Playback */}
            {videoState.hasRecording && (
              <video
                ref={playbackRef}
                controls
                playsInline
                className="w-full h-full object-cover"
                onPlay={() => setVideoState(prev => ({ ...prev, isPlaying: true }))}
                onPause={() => setVideoState(prev => ({ ...prev, isPlaying: false }))}
                onEnded={() => setVideoState(prev => ({ ...prev, isPlaying: false }))}
              />
            )}

            {/* Recording Indicator */}
            {videoState.isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 text-white px-3 py-1.5 rounded-full"
              >
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-sm font-medium">
                  {videoState.isPaused ? 'PAUSED' : 'RECORDING'}
                </span>
              </motion.div>
            )}

            {/* Timer */}
            {(videoState.isRecording || videoState.hasRecording) && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1.5 rounded-full">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(videoState.recordingTime)}</span>
                  <span className="text-gray-300">/ {formatTime(maxDuration)}</span>
                </div>
              </div>
            )}

            {/* Status Icons */}
            {!videoState.isRecording && !videoState.hasRecording && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Ready to record</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!videoState.isRecording && !videoState.hasRecording && (
              <motion.button
                type="button"
                onClick={() => startRecording()}
                disabled={!canStartRecording}
                className={cn(
                  'flex items-center space-x-2 px-6 py-3 rounded-lg font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
                  canStartRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                )}
                whileHover={canStartRecording ? { scale: 1.02 } : {}}
                whileTap={canStartRecording ? { scale: 0.98 } : {}}
              >
                <Video className="w-5 h-5" />
                <span>Start Recording</span>
              </motion.button>
            )}

            {videoState.isRecording && (
              <>
                {!videoState.isPaused ? (
                  <button
                    type="button"
                    onClick={() => pauseRecording()}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => resumeRecording()}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => stopRecording()}
                  disabled={videoState.recordingTime < minDuration}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                    videoState.recordingTime >= minDuration
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  )}
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {videoState.hasRecording && (
              <button
                type="button"
                onClick={() => resetRecording()}
                disabled={disabled}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600',
                  'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Record Again</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recording Status */}
      {videoState.hasRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-lg p-4 border',
            isRecordingValid
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
          )}
        >
          <div className="flex items-center space-x-3">
            {isRecordingValid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-green-900 dark:text-green-100 font-medium">
                    Recording Complete
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Duration: {formatTime(videoState.recordingTime)} - Your video response has been
                    captured successfully.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-yellow-900 dark:text-yellow-100 font-medium">
                    Recording Too Short
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Duration: {formatTime(videoState.recordingTime)} - Minimum{' '}
                    {formatTime(minDuration)} required.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {(videoState.error || error) && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {videoState.error || error}
        </motion.p>
      )}

      {question.helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{question.helpText}</p>
      )}
    </div>
  );
};

export const VideoResponse = VideoResponseQuestion;
export default VideoResponse;