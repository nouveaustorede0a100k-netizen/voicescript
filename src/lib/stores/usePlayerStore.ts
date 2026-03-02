import { create } from 'zustand'

type SeekFn = (time: number) => void

interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  activeSegmentId: string | null

  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setPlaying: (playing: boolean) => void
  togglePlayback: () => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void
  setActiveSegmentId: (id: string | null) => void

  /** Fonction de seek injectée par AudioPlayer une fois WaveSurfer prêt */
  _seekFn: SeekFn | null
  registerSeekFn: (fn: SeekFn) => void
  seekTo: (time: number) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  volume: 0.8,
  activeSegmentId: null,

  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (volume) => set({ volume }),
  setActiveSegmentId: (id) => set({ activeSegmentId: id }),

  _seekFn: null,
  registerSeekFn: (fn) => set({ _seekFn: fn }),
  seekTo: (time) => {
    const fn = get()._seekFn
    if (fn) fn(time)
    set({ currentTime: time })
  },
}))
