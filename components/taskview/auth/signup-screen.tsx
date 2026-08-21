"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  AuthFeedback,
  AuthHeading,
  AuthPageShell,
  FieldLabel,
  SubmitButton,
  authInputClass,
} from "@/components/taskview/auth/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { requestJson } from "@/lib/client-api";
import { resolvePostAuthPath, withReturnTo } from "@/lib/safe-return-to";
import type { User } from "@/lib/types";

export function SignupScreen({
  initialEmail = "",
  returnTo,
}: {
  initialEmail?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordReady = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError("이용약관 및 개인정보 처리방침에 동의해주세요.");
      return;
    }
    if (!passwordReady) {
      setError("비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.");
      return;
    }

    setPending(true);
    try {
      const result = await requestJson<{
        user: User;
        next_path?: string;
      }>("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          email,
          password,
          terms_accepted: termsAccepted,
          marketing_opt_in: marketingOptIn,
        }),
      });
      setPassword("");
      const destination = resolvePostAuthPath(result.next_path, returnTo);
      router.replace(destination);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "계정을 만들지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell
      cardClassName="min-h-[744px] px-6 pb-6 pt-[38px] sm:px-10"
      cardDesktopTop="xl:top-[112px]"
    >
      <AuthHeading description="계정부터 만들고 워크스페이스 설정은 다음 단계에서 진행해요." title="Needex를 시작해볼까요?" />

      <form className="mt-[22px]" onSubmit={submit}>
        <div>
          <FieldLabel htmlFor="signup-name">이름</FieldLabel>
          <Input
            autoComplete="name"
            className={authInputClass}
            id="signup-name"
            maxLength={80}
            minLength={2}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="김프로덕트"
            required
            value={displayName}
          />
        </div>

        <div className="mt-3">
          <FieldLabel htmlFor="signup-email">회사 이메일</FieldLabel>
          <Input
            autoComplete="email"
            className={authInputClass}
            id="signup-email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            required
            type="email"
            value={email}
          />
        </div>

        <div className="mt-3">
          <FieldLabel htmlFor="signup-password">비밀번호</FieldLabel>
          <Input
            aria-describedby="signup-password-rule"
            aria-invalid={password.length > 0 && !passwordReady || undefined}
            autoComplete="new-password"
            className={authInputClass}
            id="signup-password"
            maxLength={128}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상 · 영문/숫자 포함"
            required
            type="password"
            value={password}
          />
          <span className="sr-only" id="signup-password-rule">8자 이상이며 영문과 숫자를 포함해야 합니다.</span>
        </div>

        <div className="mt-3 grid min-h-[104px] content-center gap-4 rounded-xl bg-tv-canvas px-3.5 py-3 text-[11px] leading-5 text-tv-gray">
          <label className="flex items-center gap-3">
            <Checkbox checked={termsAccepted} className="size-5 rounded-md" onCheckedChange={(checked) => setTermsAccepted(checked === true)} />
            <strong className="w-[30px] text-tv-blue-500">필수</strong>
            <span>이용약관 및 개인정보 처리방침 동의</span>
          </label>
          <label className="flex items-center gap-3">
            <Checkbox checked={marketingOptIn} className="size-5 rounded-md" onCheckedChange={(checked) => setMarketingOptIn(checked === true)} />
            <strong className="w-[30px] text-tv-gray">선택</strong>
            <span>제품 업데이트 및 활용 팁 이메일 수신</span>
          </label>
        </div>

        {error ? <AuthFeedback className="mt-3">{error}</AuthFeedback> : null}

        <SubmitButton className="mt-5" pending={pending}>
          {pending ? "계정 생성 중…" : <>계정 만들기 <ArrowRight aria-hidden="true" className="size-4" /></>}
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-[13px] leading-5 text-tv-gray">
        이미 계정이 있나요? <Link className="ml-2 font-bold text-tv-blue-500 hover:text-tv-blue-700" href={withReturnTo("/login", returnTo)}>로그인</Link>
      </p>
    </AuthPageShell>
  );
}
