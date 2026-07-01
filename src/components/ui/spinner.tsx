export function Spinner({
  className = '',
  size = 40,
  borderWidth = 4,
}: {
  className?: string;
  size?: number;
  borderWidth?: number;
}) {
  return (
    <div
      className={`spinner ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth,
      }}
    >
      <style jsx>{`
        .spinner {
          display: inline-block;
          border-color: rgba(0, 0, 0, 0.1);
          border-style: solid;
          border-radius: 50%;
          border-top-color: currentColor;
          animation: spin 1s linear infinite;
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
