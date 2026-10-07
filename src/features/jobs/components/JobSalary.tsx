import { useAuth } from "@/features/auth";
import type { KeyboardEvent, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface JobSalaryProps {
  salary: string;
  /** When set, guest message navigates to login with return path. */
  loginFrom?: string;
  className?: string;
}

/** Show salary only when logged in; otherwise prompt to sign in. */
export default function JobSalary({
  salary,
  loginFrom,
  className,
}: JobSalaryProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <span className={className}>{salary}</span>;
  }

  const goLogin = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("/login", loginFrom ? { state: { from: loginFrom } } : undefined);
  };

  return (
    <span
      role="link"
      tabIndex={0}
      className={
        className
          ? `${className} text-primary-500 hover:underline cursor-pointer`
          : "text-primary-500 hover:underline cursor-pointer"
      }
      onClick={goLogin}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") goLogin(e);
      }}
    >
      {t("job.loginToSeeSalary")}
    </span>
  );
}
