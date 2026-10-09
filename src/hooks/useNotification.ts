import { useEffect, useState } from "react";

export function useNotification() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window && "serviceWorker" in navigator);
  }, []);

  return { isSupported };
}
