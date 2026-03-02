'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react'

interface AudioPlayerProps {
  audioUrl: string
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<ReturnType<typeof import('wavesurfer.js').default.create> | null>(null)
  const throttleRef = useRef<number>(0)

  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    setCurrentTime,
    setDuration,
    setPlaying,
    setPlaybackRate,
    setVolume,
    registerSeekFn,
  } = usePlayerStore()

  // Initialisation WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return

    let ws: ReturnType<typeof import('wavesurfer.js').default.create> | null = null

    async function init() {
      const WaveSurfer = (await import('wavesurfer.js')).default

      if (!waveformRef.current) return

      ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#cbd5e1',
        progressColor: '#4F46E5',
        cursorColor: '#ef4444',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 80,
        normalize: true,
        url: audioUrl,
      })

      wavesurferRef.current = ws

      ws.on('ready', () => {
        setDuration(ws!.getDuration())
        ws!.setVolume(usePlayerStore.getState().volume)
        ws!.setPlaybackRate(usePlayerStore.getState().playbackRate)
      })

      ws.on('timeupdate', (time: number) => {
        const now = performance.now()
        // Throttle à ~60fps (16ms)
        if (now - throttleRef.current < 16) return
        throttleRef.current = now
        setCurrentTime(time)
      })

      ws.on('play', () => setPlaying(true))
      ws.on('pause', () => setPlaying(false))
      ws.on('finish', () => {
        setPlaying(false)
        setCurrentTime(0)
      })

      ws.on('seeking', (time: number) => setCurrentTime(time))

      registerSeekFn((time: number) => {
        ws?.seekTo(time / ws.getDuration())
      })
    }

    init()

    return () => {
      ws?.destroy()
      wavesurferRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  // Synchroniser play/pause depuis le store
  useEffect(() => {
    const ws = wavesurferRef.current
    if (!ws) return
    if (isPlaying && !ws.isPlaying()) ws.play()
    if (!isPlaying && ws.isPlaying()) ws.pause()
  }, [isPlaying])

  // Synchroniser la vitesse
  useEffect(() => {
    wavesurferRef.current?.setPlaybackRate(playbackRate)
  }, [playbackRate])

  // Synchroniser le volume
  useEffect(() => {
    wavesurferRef.current?.setVolume(volume)
  }, [volume])

  const handlePlayPause = useCallback(() => {
    wavesurferRef.current?.playPause()
  }, [])

  const handleSkip = useCallback(
    (seconds: number) => {
      const ws = wavesurferRef.current
      if (!ws) return
      const newTime = Math.max(0, Math.min(ws.getCurrentTime() + seconds, ws.getDuration()))
      ws.seekTo(newTime / ws.getDuration())
    },
    []
  )

  return (
    <div className="space-y-4">
      {/* Waveform */}
      <div
        ref={waveformRef}
        className="w-full rounded-lg bg-slate-50 p-2 cursor-pointer"
      />

      {/* Contrôles */}
      <div className="flex items-center gap-3">
        {/* Reculer 10s */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => handleSkip(-10)}
          aria-label="Reculer 10 secondes"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Play / Pause */}
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-white text-white" />
          ) : (
            <Play className="h-5 w-5 fill-white text-white ml-0.5" />
          )}
        </Button>

        {/* Avancer 10s */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => handleSkip(10)}
          aria-label="Avancer 10 secondes"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        {/* Temps */}
        <span className="text-sm font-mono text-muted-foreground min-w-[100px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex-1" />

        {/* Vitesse */}
        <Select
          value={String(playbackRate)}
          onValueChange={(v) => setPlaybackRate(Number(v))}
        >
          <SelectTrigger className="w-[75px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAYBACK_RATES.map((rate) => (
              <SelectItem key={rate} value={String(rate)}>
                {rate}x
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Volume */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Volume"
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-10 p-2" align="center">
            <Slider
              orientation="vertical"
              min={0}
              max={1}
              step={0.05}
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              className="h-24"
              aria-label="Réglage du volume"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
