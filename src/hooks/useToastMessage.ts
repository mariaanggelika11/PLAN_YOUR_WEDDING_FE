"use client";
import { useState } from "react";
export function useToastMessage() {
  const [message, setMessage] = useState("");
  return { message, showMessage: setMessage, clearMessage: () => setMessage("") };
}
