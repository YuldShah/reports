import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"

const MAX_FILES_PER_REQUEST = 5
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif",
])

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
])

const resolvePublicBaseUrl = (request: NextRequest) => {
  const configuredUrl = process.env.TELEGRAM_MINI_APP_URL || process.env.NEXT_PUBLIC_APP_URL
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl.trim().replace(/\/+$/, "")
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host")
  if (forwardedHost) {
    const protocol = forwardedProto || "https"
    return `${protocol}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

const buildAbsoluteUrl = (request: NextRequest, pathname: string) => {
  const base = resolvePublicBaseUrl(request)
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`
}

const normalizeExtension = (fileName: string, mimeType: string) => {
  const rawExtension = path.extname(fileName || "").toLowerCase()
  if (rawExtension) {
    return rawExtension
  }

  if (mimeType === "application/pdf") return ".pdf"
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx"
  if (mimeType === "image/jpeg") return ".jpg"
  if (mimeType === "image/png") return ".png"
  if (mimeType === "image/heic") return ".heic"
  if (mimeType === "image/heif") return ".heif"

  return ".bin"
}

const isAllowedFile = (file: File) => {
  const mimeType = (file.type || "").toLowerCase()
  const extension = path.extname(file.name || "").toLowerCase()

  if (ALLOWED_MIME_TYPES.has(mimeType)) {
    return true
  }

  if (ALLOWED_EXTENSIONS.has(extension)) {
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => typeof entry === "object" && entry !== null && "arrayBuffer" in entry)

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json({ error: `Only ${MAX_FILES_PER_REQUEST} files are allowed per upload` }, { status: 400 })
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "reports")
    await fs.mkdir(uploadDirectory, { recursive: true })

    const urls: string[] = []

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `File ${file.name || "(unknown)"} exceeds the 50MB limit`,
          },
          { status: 400 },
        )
      }

      if (!isAllowedFile(file)) {
        return NextResponse.json(
          {
            error: "Only .docx, .pdf, .jpeg/.jpg, .png, .heic, and .heif files are allowed",
          },
          { status: 400 },
        )
      }

      const extension = normalizeExtension(file.name, file.type)
      const fileName = `${Date.now()}_${randomUUID()}${extension}`
      const destination = path.join(uploadDirectory, fileName)
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      await fs.writeFile(destination, fileBuffer)

      const encodedFileName = encodeURIComponent(fileName)
      urls.push(buildAbsoluteUrl(request, `/api/uploads/reports/${encodedFileName}`))
    }

    return NextResponse.json({ urls })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}
