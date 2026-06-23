"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { types?: string[]; componentRestrictions?: { country: string } }
          ) => { addListener: (event: string, cb: () => void) => void; getPlace: () => { formatted_address?: string } };
        };
      };
    };
    _evGMapsLoaded?: boolean;
  }
}

interface Props {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export default function EnderecoAutocomplete({ name, defaultValue = "", placeholder, className, maxLength }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!apiKey) return;

    const scriptId = "gm-places-script";

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode"],
        componentRestrictions: { country: "br" },
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place.formatted_address) setValue(place.formatted_address);
      });
      setReady(true);
    };

    if (window._evGMapsLoaded) {
      initAutocomplete();
      return;
    }

    if (document.getElementById(scriptId)) {
      // Script já sendo carregado — aguarda
      const interval = setInterval(() => {
        if (window._evGMapsLoaded) { clearInterval(interval); initAutocomplete(); }
      }, 200);
      return () => clearInterval(interval);
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => { window._evGMapsLoaded = true; initAutocomplete(); };
    script.onerror = () => setReady(false);
    document.head.appendChild(script);
  }, [apiKey]);

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        name={name}
        type="text"
        className={className}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={ready ? "off" : "street-address"}
      />
      {apiKey && !ready && (
        <span style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          fontSize: 10, color: "var(--clr-text-muted)", pointerEvents: "none",
        }}>
          carregando...
        </span>
      )}
    </div>
  );
}
