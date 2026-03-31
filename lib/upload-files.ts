import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

const getMimeType = (fileName: string) => {
  const extension = path.extname(fileName).toLowerCase()
  return MIME_TYPES[extension] || "application/octet-stream"
}

const getUploadDirectory = () => path.join(process.cwd(), "public", "uploads", "reports")

export const serveUploadedReportFile = async (fileNameParam: string) => {
  const normalizedName = path.basename(fileNameParam || "")

  if (!normalizedName || normalizedName !== fileNameParam) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 })
  }

  const filePath = path.join(getUploadDirectory(), normalizedName)

  try {
    const content = await fs.readFile(filePath)

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(normalizedName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    console.error("Failed to serve uploaded report file:", error)
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 })
  }
}
