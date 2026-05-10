"use client";

type PhaseErrorProps = {
  error: string;
  onReload?: () => void;
};

export function PhaseError({ error, onReload }: PhaseErrorProps) {
  const handleReload = onReload ?? (() => window.location.reload());
  return (
    <div className="text-center max-w-sm">
      <p className="text-gray-700 mb-4">{error}</p>
      <button
        onClick={handleReload}
        className="px-4 py-2 bg-riso-teal text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Reload
      </button>
    </div>
  );
}
