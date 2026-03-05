// TODO: Service de stockage Cloudflare R2 (upload, download, presigned URLs)
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

const BUCKET = process.env.R2_BUCKET_NAME!

function generateFileKey(userId: string, fileName: string): string {
  const fileId = uuidv4()
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .substring(0, 100)
  return `users/${userId}/files/${fileId}_${sanitized}`
}

export async function uploadFile(
  file: Buffer | Uint8Array,
  userId: string,
  fileName: string,
  contentType: string
): Promise<{ key: string; url: string; size: number }> {
  const key = generateFileKey(userId, fileName)

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        'user-id': userId,
        'original-name': fileName,
        'uploaded-at': new Date().toISOString(),
      },
    })
  )

  return {
    key,
    url: `${process.env.R2_PUBLIC_URL}/${key}`,
    size: file.length,
  }
}

export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

export async function getPresignedUploadUrl(
  userId: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 600
): Promise<{ uploadUrl: string; key: string }> {
  const key = generateFileKey(userId, fileName)

  // Ne pas inclure Metadata dans le presigned PUT :
  // le navigateur ne peut pas envoyer les headers x-amz-meta-*
  // ce qui causerait un SignatureDoesNotMatch.
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn,
    signableHeaders: new Set(['content-type']),
  })
  console.log('[R2] Presigned URL generated for key:', key)
  return { uploadUrl, key }
}

export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}

export async function getFileInfo(key: string): Promise<{
  exists: boolean
  size?: number
  contentType?: string
  lastModified?: Date
}> {
  try {
    const response = await r2Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )

    return {
      exists: true,
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
    }
  } catch (error: unknown) {
    const s3Error = error as { name?: string; $metadata?: { httpStatusCode?: number } }
    if (s3Error.name === 'NotFound' || s3Error.$metadata?.httpStatusCode === 404) {
      return { exists: false }
    }
    throw error
  }
}

export function extractKeyFromUrl(url: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL || ''
  return url.replace(publicUrl + '/', '')
}
