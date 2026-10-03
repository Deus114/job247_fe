import { useLocation } from "react-router-dom";

export function usePageShell() {
  const cms = useLocation().pathname.startsWith("/employer");
  return {
    cms,
    className: cms ? "" : "min-h-screen pt-[70px] bg-background-100",
  };
}
