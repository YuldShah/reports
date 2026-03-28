import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"

const MAX_FILES_PER_REQUEST = 5

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

  if (mimeType === "image/jpeg") return ".jpg"
  if (mimeType === "image/png") return ".png"
  if (mimeType === "image/webp") return ".webp"
  if (mimeType === "image/gif") return ".gif"

  return ".jpg"
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
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
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
    console.error("Photo upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}
