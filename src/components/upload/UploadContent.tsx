'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropZone } from '@/components/upload/DropZone'
import { TranscriptionOptions } from '@/components/upload/TranscriptionOptions'
import { useUpload } from '@/lib/hooks/useUpload'
import type { AccentType, Project } from '@/types'

interface UploadContentProps {
  maxSizeMB: number
  minutesRemaining: number
  defaultAccent: string
  defaultProjectId?: string | null
  projects: Pick<Project, 'id' | 'name' | 'color'>[]
}

export function UploadContent({
  maxSizeMB,
  minutesRemaining,
  defaultAccent,
  defaultProjectId = null,
  projects,
}: UploadContentProps) {
  const router = useRouter()
  const {
    status,
    progress,
    error,
    result,
    upload,
    cancel,
    retry,
    reset,
  } = useUpload()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('fr')
  const [accent, setAccent] = useState<AccentType>(defaultAccent as AccentType)
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId)

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!selectedFile || !title.trim()) return
    upload(selectedFile, { title: title.trim(), language, accent, project_id: projectId })
  }, [selectedFile, title, language, accent, projectId, upload])

  const handleReset = useCallback(() => {
    reset()
    setSelectedFile(null)
    setTitle('')
  }, [reset])

  useEffect(() => {
    if (status === 'success' && result?.transcription_id) {
      const timer = setTimeout(() => {
        router.push(`/editor/${result.transcription_id}`)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status, result, router])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <DropZone
        maxSizeMB={maxSizeMB}
        onFileSelect={handleFileSelect}
        uploadStatus={status}
        uploadProgress={progress}
        uploadError={error}
        selectedFile={selectedFile}
        onCancel={cancel}
        onRetry={retry}
        onReset={handleReset}
      />

      <TranscriptionOptions
        title={title}
        onTitleChange={setTitle}
        language={language}
        onLanguageChange={setLanguage}
        accent={accent}
        onAccentChange={setAccent}
        projectId={projectId}
        onProjectIdChange={setProjectId}
        projects={projects}
        selectedFile={selectedFile}
        minutesRemaining={minutesRemaining}
        isUploading={status === 'uploading'}
        isDisabled={status === 'success'}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
