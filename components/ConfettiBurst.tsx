"use client";

const COLORS = ["#7c5cfc", "#00d9c0", "#ffb454", "#ff5470", "#4dabf7", "#e599f7"];

export default function ConfettiBurst() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 2 + Math.random() * 1.2;
        const color = COLORS[i % COLORS.length];
        const size = 6 + Math.random() * 6;
        const rotate = Math.random() * 360;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: "-20px",
              left: `${left}%`,
              width: size,
              height: size * 0.6,
              background: color,
              opacity: 0.9,
              transform: `rotate(${rotate}deg)`,
              animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
              borderRadius: 2,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
