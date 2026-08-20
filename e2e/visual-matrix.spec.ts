import { expect, test, type Browser } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  appUrl,
  assertPageHealthy,
  attachDiagnostics,
  type E2EManifest,
} from "./support";

type Role = "anonymous" | "requester" | "owner" | "admin";
type RouteCase = {
  number: number;
  slug: string;
  route: (manifest: E2EManifest) => string;
  heading: RegExp;
  role: Role;
};

const manifestPath = process.env.TASKVIEW_E2E_MANIFEST ?? path.join("output", "verification", "state", "latest.json");

function readManifest() {
  if (!existsSync(manifestPath)) {
    throw new Error(`E2E manifest가 없습니다: ${manifestPath}. 먼저 pnpm e2e:full-story를 실행하세요.`);
  }
  return JSON.parse(readFileSync(manifestPath, "utf8")) as E2EManifest;
}

const cases: RouteCase[] = [
  { number: 1, slug: "landing", route: () => "/", heading: /원본 데이터 권한 대신/, role: "anonymous" },
  { number: 2, slug: "login", route: () => "/login", heading: /다시 만나서 반가워요/, role: "anonymous" },
  { number: 3, slug: "signup", route: () => "/signup", heading: /Needex를 시작해볼까요/, role: "anonymous" },
  { number: 4, slug: "verify-email", route: () => "/verify-email", heading: /이메일을 확인해주세요/, role: "anonymous" },
  { number: 5, slug: "forgot-password", route: () => "/forgot-password", heading: /비밀번호를 다시 설정해요/, role: "anonymous" },
  { number: 6, slug: "reset-password", route: () => "/reset-password", heading: /새 비밀번호를 설정하세요/, role: "anonymous" },
  { number: 7, slug: "workspace-onboarding", route: () => "/onboarding/workspace", heading: /워크스페이스를 설정해볼게요/, role: "anonymous" },
  { number: 8, slug: "invite-onboarding", route: () => "/onboarding/invite", heading: /함께 일할 팀원을 초대하세요/, role: "anonymous" },
  { number: 9, slug: "dashboard", route: () => "/dashboard", heading: /안녕하세요/, role: "requester" },
  { number: 10, slug: "create-task-view", route: () => "/taskviews/new", heading: /새 Task View 만들기/, role: "requester" },
  { number: 11, slug: "semantic-discovery", route: (m) => `/taskviews/${m.viewId}/discovery`, heading: /관련 데이터를 찾고 있어요/, role: "requester" },
  { number: 12, slug: "compile-validation", route: (m) => `/taskviews/${m.viewId}/validation`, heading: /Task View 설계 및 검증/, role: "requester" },
  { number: 13, slug: "approval-pending", route: (m) => `/taskviews/${m.viewId}/approval-pending`, heading: /승인이 완료되었어요|승인 요청을 보냈어요/, role: "requester" },
  { number: 14, slug: "approval-review", route: (m) => `/reviews/${m.boundary?.reviewViewId ?? m.viewId}`, heading: /Data Owner Approval/, role: "owner" },
  { number: 15, slug: "task-view-detail", route: (m) => `/taskviews/${m.viewId}`, heading: /TASK_VIEW_|JP_|TV_/, role: "requester" },
  { number: 16, slug: "task-view-dashboard", route: (m) => `/taskviews/${m.viewId}/dashboard`, heading: /가입|이탈|diagnosis|분석/i, role: "requester" },
  { number: 17, slug: "task-views", route: () => "/taskviews", heading: /^Task Views$/, role: "requester" },
  { number: 18, slug: "approvals", route: () => "/approvals", heading: /^승인 요청$/, role: "owner" },
  { number: 19, slug: "data-sources", route: () => "/data-sources", heading: /^데이터 소스$/, role: "admin" },
  { number: 20, slug: "connect-data-source", route: () => "/data-sources/connect", heading: /^데이터 소스 연결$/, role: "admin" },
  { number: 21, slug: "connect-complete", route: () => "/data-sources/connect/complete", heading: /스캔 결과를 찾을 수 없습니다|스키마 스캔이 완료됐어요/, role: "admin" },
  { number: 22, slug: "data-source-detail", route: () => "/data-sources/seoul-product", heading: /Seoul Product|데이터 소스를 열 수 없습니다/, role: "admin" },
  { number: 23, slug: "audit-log", route: () => "/audit", heading: /^Audit Log$/, role: "admin" },
  { number: 24, slug: "evidence-contract", route: (m) => `/evidence/${m.evidenceId}`, heading: /Evidence Contract/, role: "admin" },
  { number: 25, slug: "settings-workspace", route: () => "/settings/workspace", heading: /^설정$/, role: "admin" },
  { number: 26, slug: "settings-policy", route: () => "/settings/policy", heading: /^설정$/, role: "admin" },
  { number: 27, slug: "settings-team", route: () => "/settings/team", heading: /^설정$/, role: "admin" },
  { number: 28, slug: "settings-integrations", route: () => "/settings/integrations", heading: /^설정$/, role: "admin" },
  { number: 29, slug: "account", route: () => "/account", heading: /^설정$/, role: "requester" },
  { number: 30, slug: "ui-states", route: () => "/ui-states", heading: /UX States & Overlays/, role: "admin" },
];

async function contextFor(browser: Browser, manifest: E2EManifest, role: Role) {
  const storageState = role === "anonymous" ? undefined : manifest.states[role];
  return browser.newContext({
    storageState,
    viewport: { width: 1440, height: 1024 },
    colorScheme: "light",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  });
}

test.describe("@visual-matrix Figma UI 작업 30개 라우트", () => {
  test.describe.configure({ mode: "serial" });
  const manifest = readManifest();

  for (const item of cases) {
    test(`${String(item.number).padStart(2, "0")} ${item.slug}`, async ({ browser }) => {
      const context = await contextFor(browser, manifest, item.role);
      const page = await context.newPage();
      const diagnostics = attachDiagnostics(page);
      const route = item.route(manifest);
      const response = await page.goto(appUrl(route), { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} HTTP status`).toBeLessThan(400);
      await expect(page.getByRole("heading", { name: item.heading }).first()).toBeVisible();
      if (["login", "signup", "forgot-password", "account"].includes(item.slug)) {
        await expect(page.getByText(/Google (SSO|계정|로그인|연결)|Google로/)).toHaveCount(0);
      }
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(300);
      await assertPageHealthy(page, diagnostics, `${item.number} ${route}`);
      await page.screenshot({
        path: path.join("output", "verification", "screens", `${String(item.number).padStart(2, "0")}-${item.slug}.png`),
        fullPage: false,
      });
      await context.close();
    });
  }
});

test.describe("@visual-matrix 지원 인증 방식", () => {
  test("Google OAuth BFF 경로를 제공하지 않는다", async ({ request }) => {
    const [start, callback] = await Promise.all([
      request.get(appUrl("/api/auth/google/start")),
      request.get(appUrl("/api/auth/google/callback?code=test&state=test")),
    ]);

    expect(start.status()).toBe(404);
    expect(callback.status()).toBe(404);
  });
});


type MobileRouteCase = Omit<RouteCase, "number"> & { number: 31 | 32 | 33 | 34 | 35 };

const mobileCases: MobileRouteCase[] = [
  { number: 31, slug: "mobile-signup", route: () => "/signup", heading: /Needex를 시작해볼까요/, role: "anonymous" },
  { number: 32, slug: "mobile-dashboard", route: () => "/dashboard", heading: /안녕하세요/, role: "requester" },
  { number: 33, slug: "mobile-task-view", route: (m) => `/taskviews/${m.viewId}`, heading: /TASK_VIEW_|JP_|TV_/, role: "requester" },
  { number: 34, slug: "mobile-data-sources", route: () => "/data-sources", heading: /^데이터 소스$/, role: "admin" },
  { number: 35, slug: "mobile-settings", route: () => "/settings/integrations", heading: /^설정$/, role: "admin" },
];

test.describe("@visual-matrix 모바일 대표 화면", () => {
  test.describe.configure({ mode: "serial" });
  const manifest = readManifest();

  for (const item of mobileCases) {
    test(`${item.number} ${item.slug}`, async ({ browser }) => {
      const storageState = item.role === "anonymous" ? undefined : manifest.states[item.role];
      const context = await browser.newContext({
        storageState,
        viewport: { width: 390, height: 844 },
        colorScheme: "light",
        locale: "ko-KR",
        timezoneId: "Asia/Seoul",
      });
      const page = await context.newPage();
      const diagnostics = attachDiagnostics(page);
      const route = item.route(manifest);
      const response = await page.goto(appUrl(route), { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} mobile HTTP status`).toBeLessThan(400);
      await expect(page.getByRole("heading", { name: item.heading }).first()).toBeVisible();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(300);
      await assertPageHealthy(page, diagnostics, `${item.number} mobile ${route}`);
      await page.screenshot({
        path: path.join("output", "verification", "mobile", `${item.number}-${item.slug}.png`),
        fullPage: false,
      });
      await context.close();
    });
  }
});

test.describe("@visual-matrix 반응형 overflow 회귀", () => {
  const manifest = readManifest();

  test("1024px dashboard metric cards keep content inside their bounds", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: manifest.states.requester,
      viewport: { width: 1024, height: 768 },
      colorScheme: "light",
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
    });
    const page = await context.newPage();
    const diagnostics = attachDiagnostics(page);
    const response = await page.goto(appUrl("/dashboard"), { waitUntil: "domcontentloaded" });
    expect(response?.status(), "dashboard HTTP status").toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /안녕하세요/ })).toBeVisible();
    await page.waitForLoadState("networkidle").catch(() => undefined);

    const metricOverflow = await page
      .locator('section[aria-label="Task View 핵심 지표"] > section')
      .evaluateAll((cards) => cards.map((card) => card.scrollHeight - card.clientHeight));
    expect(metricOverflow, "dashboard metric card vertical overflow").toEqual([0, 0, 0]);
    await assertPageHealthy(page, diagnostics, "1024px dashboard overflow regression");
    await context.close();
  });
});
