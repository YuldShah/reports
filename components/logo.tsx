export default function Logo() {
  return (
    <div className="flex justify-center mb-2">
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
        <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <span className="font-heading text-sm font-semibold text-primary tracking-wide">Reports</span>
      </div>
    </div>
  )
}
