export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto mt-8">
      <p className="text-sm font-semibold text-red-800 mb-1">Failed to load</p>
      <p className="text-xs text-red-600 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700">
          Try again
        </button>
      )}
    </div>
  );
}
