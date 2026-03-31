import { serveUploadedReportFile } from "@/lib/upload-files"

export const runtime = "nodejs"

export async function GET(_request: Request, context: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await context.params
  return serveUploadedReportFile(fileName)
}
