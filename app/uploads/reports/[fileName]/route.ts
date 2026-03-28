import { serveUploadedReportFile } from "@/lib/upload-files"

export const runtime = "nodejs"

export async function GET(_request: Request, { params }: { params: { fileName: string } }) {
  return serveUploadedReportFile(params.fileName)
}
