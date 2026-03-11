export default function Logo() {
  return (
    <div className="flex justify-center mb-2">
      <div className="border border-border bg-card flex items-center px-2 py-1 rounded-full">
        <div className="w-6 h-6 bg-telegram-blue rounded-md flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <span className="mr-1 text-sm font-semibold text-white">Reports</span>
      </div>
    </div>
  )
}
