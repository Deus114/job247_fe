import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset window + nested layout scroll containers on every route change. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll("[data-scroll-reset]").forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}
