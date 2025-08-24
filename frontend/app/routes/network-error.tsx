export default function NetworkErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <h1 className="text-2xl font-bold mb-4">Connection Problem</h1>
      <p className="mb-4">We couldn’t reach the server. Please check your internet and try again.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded bg-blue-600 text-white"
      >
        Retry
      </button>
    </div>
  );
}
