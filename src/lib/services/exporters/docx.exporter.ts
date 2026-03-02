import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  BorderStyle,
} from 'docx'
import type { Segment } from '@/types'
import { formatTimestampBracket } from './format-timestamp'

interface DocxMetadata {
  title: string
  createdAt: string
  duration: number | null
  language: string
  wordCount: number
}

/**
 * Génère un document Word (.docx) formaté avec titre, métadonnées et contenu.
 * Compatible Word et Google Docs.
 */
export async function exportToDocx(
  segments: Segment[],
  metadata: DocxMetadata
): Promise<Buffer> {
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m} min ${s} s`
  }

  const children: Paragraph[] = []

  // Titre
  children.push(
    new Paragraph({
      text: metadata.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  )

  // Métadonnées
  const metaLines = [
    `Date : ${new Date(metadata.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    `Durée : ${formatDuration(metadata.duration)}`,
    `Langue : ${metadata.language === 'fr' ? 'Français' : metadata.language}`,
    `Mots : ${metadata.wordCount.toLocaleString('fr-FR')}`,
  ]

  children.push(
    new Paragraph({
      children: metaLines.map(
        (line, i) =>
          new TextRun({
            text: line + (i < metaLines.length - 1 ? '  |  ' : ''),
            size: 18,
            color: '666666',
            font: 'Calibri',
          })
      ),
      spacing: { after: 100 },
    })
  )

  // Séparateur
  children.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
      spacing: { after: 300 },
    })
  )

  // Segments
  for (const segment of segments) {
    const runs: TextRun[] = []

    // Timestamp
    runs.push(
      new TextRun({
        text: formatTimestampBracket(segment.start_time) + '  ',
        size: 18,
        color: '999999',
        font: 'Consolas',
      })
    )

    // Speaker
    if (segment.speaker) {
      runs.push(
        new TextRun({
          text: segment.speaker + ' : ',
          bold: true,
          size: 22,
          font: 'Calibri',
        })
      )
    }

    // Texte
    runs.push(
      new TextRun({
        text: segment.text.trim(),
        size: 22,
        font: 'Calibri',
      })
    )

    children.push(
      new Paragraph({
        children: runs,
        spacing: { after: 120 },
        alignment: AlignmentType.LEFT,
      })
    )
  }

  // Footer
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
    })
  )
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Généré par VoiceScript — voicescript.ai',
          size: 16,
          color: '999999',
          italics: true,
          font: 'Calibri',
        }),
      ],
      spacing: { before: 100 },
      alignment: AlignmentType.CENTER,
    })
  )

  const doc = new Document({
    creator: 'VoiceScript',
    title: metadata.title,
    description: `Transcription générée par VoiceScript`,
    sections: [{ children }],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
