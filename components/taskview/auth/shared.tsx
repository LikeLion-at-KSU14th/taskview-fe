import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { NeedexLogo } from "@/components/taskview/logo";
import { CountryFlag } from "@/components/taskview/country-flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const authInputClass =
  "h-[46px] rounded-[10px] border-tv-border bg-white px-3.5 text-[13px] text-tv-ink shadow-none placeholder:text-tv-slate focus-visible:border-tv-blue-500 focus-visible:ring-tv-blue-500/20";

export const primaryCtaClass =
  "h-12 rounded-xl bg-tv-blue-500 px-4 text-[14px] font-medium text-white shadow-none hover:bg-tv-blue-600 focus-visible:ring-tv-blue-500/25";

export const secondaryCtaClass =
  "h-12 rounded-xl border-tv-border bg-white px-4 text-[14px] font-medium text-tv-ink shadow-none hover:bg-tv-canvas";

export function AuthBrandPanel() {
  const sources = [
    ["🇺🇸", "FCC Complaints", "issue · channel"],
    ["🇺🇸", "NYC 311", "agency · resolution"],
    ["🇺🇸", "NHTSA Safety", "component · crash"],
  ];

  return (
    <aside className="hidden min-h-[1024px] flex-col overflow-hidden bg-tv-blue-50 px-[clamp(32px,3.9vw,56px)] pt-12 xl:flex">
      <NeedexLogo href="/" />

      <div className="h-[132px] shrink-0" />
      <h1 className="max-w-[480px] text-[34px] font-bold leading-[46px] tracking-[-0.035em] text-tv-ink">
        더 많이 공유하지 않아도,
        <br />
        더 잘 협업할 수 있어요.
      </h1>
      <p className="mt-[22px] max-w-[470px] text-[15px] leading-[1.65] text-tv-gray">
        업무 목적을 입력하면 필요한 의미만 남긴 Task View를 만들어
        <br className="hidden min-[1380px]:block" /> 원본 개인정보 없이도 글로벌 팀이 같은 문제를 해결할 수 있습니다.
      </p>

      <div className="mt-9 w-full max-w-[508px] rounded-[18px] border border-tv-blue-200 bg-white px-5 pb-[18px] pt-5">
        <p className="text-[13px] font-bold leading-5 text-tv-ink">
          “NYC 311 민원에서 운영 병목을 찾고 싶어요.”
        </p>
        <div className="mt-5 grid gap-2.5">
          {sources.map(([flag, name, meta]) => (
            <div className="grid h-[38px] grid-cols-[minmax(0,1fr)_minmax(100px,0.95fr)] items-center rounded-[10px] bg-tv-canvas px-3 text-[11px]" key={name}>
              <span className="flex items-center gap-2 font-medium text-tv-ink">
                <CountryFlag code={flag} size="sm" /> {name}
              </span>
              <span className="text-tv-gray">{meta}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-9 text-[12px] font-medium leading-5 text-tv-blue-500">
        Purpose limited · Privacy firewall · Human approval · Auditable
      </p>
    </aside>
  );
}

export function AuthPageShell({
  children,
  cardClassName,
  cardDesktopTop,
  footer,
  footerClassName,
  backHref = "/",
  backLabel = "홈으로",
}: {
  children: ReactNode;
  cardClassName?: string;
  cardDesktopTop: string;
  footer?: ReactNode;
  footerClassName?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="min-h-screen w-full bg-white font-sans text-tv-ink xl:grid xl:min-h-[1024px] xl:grid-cols-[minmax(440px,43.0556%)_minmax(0,56.9444%)]">
      <AuthBrandPanel />
      <section className="relative min-h-screen bg-white px-5 pb-12 pt-6 sm:px-8 xl:min-h-[1024px] xl:px-0 xl:py-0">
        <Link
          className="inline-flex h-5 items-center gap-1.5 text-[12px] font-medium text-tv-blue-500 hover:text-tv-blue-700 xl:absolute xl:left-16 xl:top-12"
          href={backHref}
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" strokeWidth={2} />
          {backLabel}
        </Link>

        <section
          className={cn(
            "mx-auto mt-16 w-full max-w-[488px] overflow-hidden rounded-[20px] border border-tv-border bg-white xl:absolute xl:left-1/2 xl:mt-0 xl:-translate-x-1/2",
            cardDesktopTop,
            cardClassName,
          )}
        >
          {children}
        </section>

        {footer ? (
          <div className={cn("mx-auto mt-6 w-full max-w-[520px] text-center xl:absolute xl:left-1/2 xl:mt-0 xl:-translate-x-1/2", footerClassName)}>
            {footer}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function AuthHeading({ title, description, centered = false }: { title: string; description: ReactNode; centered?: boolean }) {
  return (
    <div className={cn(centered && "text-center")}>
      <h1 className="text-[26px] font-bold leading-[1.4] tracking-[-0.035em] text-tv-ink sm:text-[28px]">{title}</h1>
      <div className="mt-0.5 text-[13px] leading-[1.55] text-tv-gray">{description}</div>
    </div>
  );
}

export function FieldLabel({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1 block text-[12px] font-medium leading-5 text-tv-ink", className)} {...props} />;
}

export function PasswordInput({
  id,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  placeholder = "••••••••••••",
  describedBy,
  invalid,
}: {
  id: string;
  value: string;
  onChange: ComponentProps<"input">["onChange"];
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
  placeholder?: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <Input
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        autoComplete={autoComplete}
        className={cn(authInputClass, "pr-11")}
        id={id}
        maxLength={128}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={visible ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        className="absolute right-1 top-1 grid size-[38px] place-items-center rounded-lg text-tv-gray transition-colors hover:bg-tv-canvas hover:text-tv-ink"
        onClick={onToggle}
        type="button"
      >
        <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

type FeedbackTone = "error" | "info" | "success";

export function AuthFeedback({ children, tone = "error", className }: { children: ReactNode; tone?: FeedbackTone; className?: string }) {
  const Icon = tone === "error" ? CircleAlert : tone === "success" ? Check : Info;
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[11px] leading-[1.55]",
        tone === "error" && "bg-tv-red-50 text-tv-red-700",
        tone === "success" && "bg-tv-green-50 text-tv-green-700",
        tone === "info" && "bg-tv-blue-50 text-tv-blue-700",
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
      <span>{children}</span>
    </div>
  );
}

export function SubmitButton({ children, pending, className }: { children: ReactNode; pending: boolean; className?: string }) {
  return (
    <Button className={cn(primaryCtaClass, "w-full gap-2", className)} disabled={pending} type="submit">
      {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function OnboardingShell({
  step,
  title,
  description,
  children,
}: {
  step: 1 | 2;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white font-sans text-tv-ink xl:min-h-[1024px]">
      <header className="h-[76px] border-b border-tv-border bg-white">
        <div className="flex h-full w-full items-center justify-between px-5 sm:px-8 xl:px-[clamp(2.5rem,4vw,6rem)]">
          <NeedexLogo href="/" />
          <p className="text-[12px] font-medium text-tv-gray">설정 {step} / 2</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-11 sm:px-8 xl:pt-[48px]">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.3] tracking-[-0.035em] text-tv-ink sm:text-[30px]">{title}</h1>
          <p className="mt-1 text-[13px] leading-[1.55] text-tv-gray">{description}</p>
        </div>
        <Progress aria-label={`온보딩 ${step}단계`} className="mt-[19px] h-2 bg-tv-border" value={step * 50} />
        <div className="mt-9">{children}</div>
      </div>
    </main>
  );
}
