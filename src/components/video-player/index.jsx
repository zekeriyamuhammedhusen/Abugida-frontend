import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import ReactPlayer from "react-player";
import { Slider } from "../ui/slider";
import { Button } from "../ui/button";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import Hls from 'hls.js';
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

const CLOUD_NAME = "dcfvnkxkj"; // Replace with your Cloudinary cloud name

function VideoPlayer({
  width = "100%",
  height = "100%",
  url,
  onProgressUpdate,
  onComplete,
  courseId,
  studentId,
  lessonId,
  publicId,
  thumbnailPublicId,
  candidates = {},
  previewMode = false,
  previewSeconds = 60,
}) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(true); // start muted to allow autoplay
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);

  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);

  const [effectiveUrl, setEffectiveUrl] = useState(url || null);
  const [useReactPlayer, setUseReactPlayer] = useState(() => (url ? !url.includes('.m3u8') : false));

  // Play/Pause toggle
  function handlePlayAndPause() {
    setPlaying(!playing);
  }

  // Update current time
  function handleProgress(state) {
    if (!seeking) {
      setPlayed(state.played);
      if (previewMode && !isEnrolled && !previewEnded) {
        const dur = playerRef?.current?.getDuration?.() || 0;
        const current = (state.played || 0) * dur;
        if (dur > 0 && current >= previewSeconds) {
          setPreviewEnded(true);
          setPlaying(false);
          try { playerRef?.current?.seekTo(previewSeconds / dur); } catch {}
          toast.info("Preview ended. Enroll to watch the full lesson.");
        }
      }
    }
  }

  function handleRewind() {
    playerRef?.current?.seekTo(playerRef?.current?.getCurrentTime() - 5);
  }

  function handleForward() {
    playerRef?.current?.seekTo(playerRef?.current?.getCurrentTime() + 5);
  }

  function handleToggleMute() {
    setMuted(!muted);
  }

  function handleSeekChange(newValue) {
    setPlayed(newValue[0]);
    setSeeking(true);
  }

  function handleSeekMouseUp() {
    setSeeking(false);
    playerRef.current?.seekTo(played);
  }

  function handleVolumeChange(newValue) {
    setVolume(newValue[0]);
  }

  function pad(string) {
    return ("0" + string).slice(-2);
  }

  function formatTime(seconds) {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = pad(date.getUTCSeconds());
    return hh ? `${hh}:${pad(mm)}:${ss}` : `${mm}:${ss}`;
  }

  const handleFullScreen = useCallback(() => {
    if (!isFullScreen) {
      if (playerContainerRef?.current.requestFullscreen) {
        playerContainerRef?.current?.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullScreen]);

  // fullscreen change listener
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  // Check enrollment on mount
  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        const res = await api.get(
          `/api/enrollments/check?studentId=${studentId}&courseId=${courseId}`
        );
        setIsEnrolled(res.data?.isEnrolled || false);
      } catch (error) {
        console.error("Error checking enrollment:", error);
      }
    };

    if (studentId && courseId) {
      checkEnrollment();
    }
  }, [studentId, courseId]);

  // Save progress only if enrolled
  useEffect(() => {
    if (played >= 0.99 && !hasCompleted && isEnrolled) {
      setHasCompleted(true);

      const updateProgress = async () => {
        try {
          const response = await api.post(`/api/progress`, {
            studentId,
            courseId,
            lessonId,
          });

          const data = response.data;

          toast.success("Lesson marked as completed!");
          onProgressUpdate?.({
            studentId,
            courseId,
            lessonId,
            isCompleted: true,
            progressValue: played,
          });
          onComplete?.(); // Call onComplete when lesson is marked as completed
        } catch (error) {
          console.error("Error updating progress:", error);
          toast.error("Failed to mark lesson as completed.");
        }
      };

      updateProgress();
    }
  }, [
    played,
    hasCompleted,
    studentId,
    courseId,
    lessonId,
    isEnrolled,
    onProgressUpdate,
    onComplete,
  ]);

  const buildCloudinaryMp4 = (pid) => (pid ? `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${pid}.mp4` : null);
  const cld = new Cloudinary({ cloud: { cloudName: CLOUD_NAME } });

  // Keep effectiveUrl synced with incoming url
  useEffect(() => {
    const initial = url
      || candidates?.hls
      || candidates?.mp4
      || candidates?.playbackUrl
      || buildCloudinaryMp4(publicId);
    setEffectiveUrl(initial || null);
    setUseReactPlayer(initial ? !String(initial).includes('.m3u8') : false);
    setPreviewEnded(false);
    if (initial) setPlaying(true);
  }, [url, candidates, publicId]);

  // HLS setup and silent fallback to MP4
  useEffect(() => {
    const v = videoRef.current;
    const isHls = !!effectiveUrl && effectiveUrl.includes('.m3u8');
    if (!effectiveUrl || !v) return;

    let hlsInstance = null;

    const setupHls = async () => {
      try { await fetch(effectiveUrl, { method: 'HEAD' }); } catch {}
      if (Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(effectiveUrl);
        hlsInstance.attachMedia(v);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => { if (playing) v.play().catch(() => {}); });
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          const isFatal = data?.fatal === true;
          const details = data?.details || '';
          if (isFatal && (details === 'manifestLoadError' || details === 'networkError')) {
            try { hlsInstance?.destroy(); } catch {}
            const mp4 = candidates?.mp4;
            const alt = mp4 || candidates?.playbackUrl || buildCloudinaryMp4(publicId);
            if (alt) {
              setEffectiveUrl(alt);
              setUseReactPlayer(true);
              setPlaying(true);
            } else {
              toast.error('Video not ready yet. Please try again shortly.');
            }
          } else {
            toast.error('Video playback failed.');
          }
        });
      } else {
        v.src = effectiveUrl;
      }
    };

    if (isHls) setupHls();
    return () => { try { hlsInstance?.destroy(); } catch {} };
  }, [effectiveUrl, playing, candidates, publicId]);

  // Autoplay for native video when switching sources
  useEffect(() => {
    if (!useReactPlayer && videoRef.current && effectiveUrl && !effectiveUrl.includes('.m3u8')) {
      videoRef.current.src = effectiveUrl;
      videoRef.current.play().catch(() => {});
    }
  }, [effectiveUrl, useReactPlayer]);

  // native video error handling (MP4 or native HLS)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onError = (e) => {
      console.error('Native video error', e);
      toast.error('Video failed to load. Please try again later.');
      setPlaying(false);
    };
    v.addEventListener('error', onError);
    return () => v.removeEventListener('error', onError);
  }, []);

  // Sync play/pause for native video
  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  // Progress tracking for native video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handler = () => {
      const duration = v.duration || 0;
      const current = v.currentTime || 0;
      if (!seeking && duration > 0) {
        setPlayed(current / duration);
      }
    };
    v.addEventListener('timeupdate', handler);
    return () => v.removeEventListener('timeupdate', handler);
  }, [seeking]);
  
  // Helpers for duration/current time across players
  const getDuration = () => (useReactPlayer
    ? (playerRef?.current?.getDuration?.() || 0)
    : (videoRef.current?.duration || 0));
  const getCurrentTime = () => (useReactPlayer
    ? (playerRef?.current?.getCurrentTime?.() || 0)
    : (videoRef.current?.currentTime || 0));

  // Adjust rewind/forward and seek for native video
  function handleRewind() {
    if (useReactPlayer) {
      const t = playerRef?.current?.getCurrentTime?.() ?? 0;
      playerRef?.current?.seekTo(t - 5);
    } else if (videoRef.current) {
      try { videoRef.current.currentTime = Math.max(getCurrentTime() - 5, 0); } catch {}
    }
  }

  function handleForward() {
    if (useReactPlayer) {
      const t = playerRef?.current?.getCurrentTime?.() ?? 0;
      playerRef?.current?.seekTo(t + 5);
    } else if (videoRef.current) {
      const dur = getDuration();
      try { videoRef.current.currentTime = Math.min(getCurrentTime() + 5, dur || getCurrentTime() + 5); } catch {}
    }
  }

  function handleSeekMouseUp() {
    setSeeking(false);
    const dur = getDuration();
    if (useReactPlayer) {
      playerRef.current?.seekTo(played);
    } else if (videoRef.current && dur > 0) {
      try { videoRef.current.currentTime = played * dur; } catch {}
    }
  }
  // Generic player (Cloudinary or other direct URL)
  return (
    <div
      ref={playerContainerRef}
      className={`relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ease-in-out 
      ${isFullScreen ? "w-screen h-screen" : ""}`}
      style={{ width, height }}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {effectiveUrl && !useReactPlayer ? (
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full"
          controls={false}
          muted={muted}
          playsInline
        />
      ) : (
        <ReactPlayer
          ref={playerRef}
          className="absolute top-0 left-0"
          width="100%"
          height="100%"
          url={effectiveUrl || ""}
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
        />
      )}

      {thumbnailPublicId && (
        <div className="hidden">{/* keep ability to derive thumbnail if needed */}
          <AdvancedImage
            cldImg={
              cld
                .image(thumbnailPublicId)
                .format('auto')
                .quality('auto')
                .resize(auto().gravity(autoGravity()).width(500).height(300))
            }
          />
        </div>
      )}

      {hasCompleted && isEnrolled && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 text-sm rounded">
          Completed
        </div>
      )}

      {!isEnrolled && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 text-sm rounded">
          Preview Mode
        </div>
      )}

      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-75 p-4">
          <Slider
            value={[played * 100]}
            max={100}
            step={0.1}
            onValueChange={(value) => handleSeekChange([value[0] / 100])}
            onValueCommit={handleSeekMouseUp}
            className="w-full mb-4"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handlePlayAndPause}
                variant="ghost"
                size="icon"
                className="text-white"
              >
                {playing ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                onClick={handleRewind}
                variant="ghost"
                size="icon"
                className="text-white"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
              <Button
                onClick={handleForward}
                variant="ghost"
                size="icon"
                className="text-white"
              >
                <RotateCw className="h-6 w-6" />
              </Button>
              <Button
                onClick={handleToggleMute}
                variant="ghost"
                size="icon"
                className="text-white"
              >
                {muted ? (
                  <VolumeX className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => handleVolumeChange([value[0] / 100])}
                className="w-24"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-white">
                {formatTime(played * getDuration())}/ {formatTime(getDuration())}
              </div>
              <Button
                onClick={handleFullScreen}
                variant="ghost"
                size="icon"
                className="text-white"
              >
                {isFullScreen ? (
                  <Minimize className="h-6 w-6" />
                ) : (
                  <Maximize className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;