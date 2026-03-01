export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-9 h-9 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[13px] text-gray-400 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto mt-8">
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-red-800 mb-1">Failed to load</p>
      <p className="text-xs text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs bg-red-600 text-white px-5 py-2 rounded-xl hover:bg-red-700 transition-colors font-semibold"
        >
          Try again
        </button>
      )}
    </div>
  );
}
