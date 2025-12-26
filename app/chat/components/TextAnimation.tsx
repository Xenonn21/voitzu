"use client";

import { useEffect, useState } from "react";

const texts = [
  "Welcome to VoiTzu",
  "A calm space to think",
  "Ask anything, anytime",
];

export default function TextAnimation() {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let charIndex = 0;
    const currentText = texts[index];

    const typing = setInterval(() => {
      setDisplay(currentText.slice(0, charIndex + 1));
      charIndex++;

      if (charIndex === currentText.length) {
        clearInterval(typing);

        setTimeout(() => {
          setDisplay("");
          setIndex((prev) => (prev + 1) % texts.length);
        }, 2000);
      }
    }, 60);

    return () => clearInterval(typing);
  }, [index]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <h2
        className="
          text-xl sm:text-3xl font-medium
          text-gray-400
          tracking-wide
          animate-fadeIn
        "
      >
        {display}
        <span className="animate-pulse">▍</span>
      </h2>
    </div>
  );
}
