export default function Loading() {
  return (
    <div className="relative z-10 min-h-screen text-foreground flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading game...</p>
      </div>
    </div>
  );
}
