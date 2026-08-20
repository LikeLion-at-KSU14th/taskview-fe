"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { postFlowJson } from "@/components/taskview/auth/api";
import {
  AuthFeedback,
  AuthPageShell,
  FieldLabel,
  SubmitButton,
  authInputClass,
} from "@/components/taskview/auth/shared";
import { Input } from "@/components/ui/input";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [developmentToken, setDevelopmentToken] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    try {
      const result = await postFlowJson<{ development_token?: string | null }>(
        "/api/auth/password-reset-requests",
        { email },
        "비밀번호 재설정 요청 API가 아직 연결되지 않았습니다.",
      );
      setDevelopmentToken(result.development_token ?? null);
      setFeedback({ tone: "success", message: "계정이 존재하는 경우 비밀번호 재설정 링크를 보냈습니다." });
    } catch (cause) {
      setFeedback({ tone: "error", message: cause instanceof Error ? cause.message : "재설정 링크를 보내지 못했습니다." });
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell
      backHref="/login"
      backLabel="로그인으로"
      cardClassName="min-h-[458px] px-6 pb-7 pt-9 text-center sm:px-10"
      cardDesktopTop="xl:top-[230px]"
      footer={
        <div className="min-h-[70px] rounded-xl bg-tv-blue-50 px-3.5 py-3 text-left text-[11px] leading-[1.55] text-tv-blue-700">
          <strong className="block font-medium">보안 안내</strong>
          <span>계정 존재 여부와 관계없이 동일한 안내 화면을 보여 개인정보 노출을 줄입니다.</span>
        </div>
      }
      footerClassName="max-w-[488px] xl:top-[710px]"
    >
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-tv-blue-50 text-tv-blue-500">
        <RotateCcw aria-hidden="true" className="size-8" strokeWidth={1.7} />
      </div>
      <h1 className="mt-[22px] text-[26px] font-bold leading-[1.4] tracking-[-0.035em] text-tv-ink">비밀번호를 다시 설정해요</h1>
      <p className="mt-0.5 text-[13px] leading-[1.55] text-tv-gray">가입한 회사 이메일을 입력하면 재설정 링크를 보내드릴게요.</p>

      <form className="mt-7 text-left" onSubmit={submit}>
        <FieldLabel htmlFor="recovery-email">회사 이메일</FieldLabel>
        <Input
          autoComplete="email"
          className={authInputClass}
          id="recovery-email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          required
          type="email"
          value={email}
        />
        {feedback ? <AuthFeedback className="mt-3" tone={feedback.tone}>{feedback.message}</AuthFeedback> : null}
        {developmentToken ? (
          <Link className="mt-3 inline-flex text-[11px] font-medium text-tv-blue-500 hover:text-tv-blue-700" href={`/reset-password?token=${encodeURIComponent(developmentToken)}`}>
            개발 모드 재설정 링크 열기 →
          </Link>
        ) : null}
        <SubmitButton className="mt-[18px] gap-2" pending={pending}>
          {pending ? "전송 중…" : <>재설정 링크 보내기 <ArrowRight aria-hidden="true" className="size-4" /></>}
        </SubmitButton>
      </form>
    </AuthPageShell>
  );
}
