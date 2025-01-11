export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`spinner ${className}`}>
      <style jsx>{`
        .spinner {
          display: inline-block;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #3498db;
          width: 40px;
          height: 40px;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
