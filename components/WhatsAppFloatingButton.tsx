"use client";

import { SiWhatsapp } from "react-icons/si";

const WHATSAPP_URL = "https://wa.me/213542458175";

export function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="التواصل عبر واتساب"
      className="fixed bottom-5 right-5 z-[1400] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-green-500/40 transition hover:scale-105 hover:bg-[#1fb85a]"
    >
      <SiWhatsapp className="h-7 w-7" />
    </a>
  );
}
