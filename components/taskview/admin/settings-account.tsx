"use client";

import {
  ArrowRight,
  Check,
  Clipboard,
  ExternalLink,
  KeyRound,
  Lock,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/components/session-provider";
import {
  AdminBadge,
  AdminEmptyState,
  AdminErrorState,
  AdminPage,
  AdminPanel,
  ApiFallbackNotice,
  DefinitionRows,
  MiniSkeleton,
  PageTitle,
  SectionHeading,
  SettingsColumns,
} from "@/components/taskview/admin/admin-ui";
import { adminEndpoints, sendAdminMutation, useAdminResource } from "@/components/taskview/admin/admin-resource";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

function SettingsPage({ children, onSave, saving = false }: { children: React.ReactNode; onSave?: () => void | Promise<void>; saving?: boolean }) {
  return <AdminPage><PageTitle action={onSave ? <Button className="h-[42px] rounded-[10px] px-5 text-[12px]" disabled={saving} onClick={() => void onSave()}>{saving ? "저장 중…" : "변경사항 저장"}</Button> : undefined} description="워크스페이스 기본값과 조직 운영 설정을 관리합니다." title="설정" />{children}</AdminPage>;
}

interface WorkspaceSettings {
  name: string;
  region: string;
  ttl: string;
  output: string;
  notifications: { approval: boolean; approved: boolean; expiry: boolean; audit: boolean };
}
const workspaceFallback: WorkspaceSettings = { name: "Global Product Workspace", region: "Seoul · KR", ttl: "7일", output: "Dashboard + API", notifications: { approval: true, approved: true, expiry: true, audit: false } };
const emptyWorkspace: WorkspaceSettings = { name: "", region: "", ttl: "", output: "", notifications: { approval: false, approved: false, expiry: false, audit: false } };
interface ApiWorkspace { name: string; region: "KR-11" | "JP-13" | "VN-SG" | "GLOBAL"; default_ttl_days: number; default_output_mode: "dashboard" | "api" | "dashboard_api"; notifications: { approval_requested: boolean; view_approved: boolean; ttl_expiring: boolean; audit_events: boolean } }
function normalizeWorkspace(response: ApiWorkspace): WorkspaceSettings {
  return {
    name: response.name,
    region: response.region === "JP-13" ? "Tokyo · JP" : response.region === "VN-SG" ? "HCMC · VN" : response.region === "GLOBAL" ? "Global" : "Seoul · KR",
    ttl: `${response.default_ttl_days}일`,
    output: response.default_output_mode === "dashboard_api" ? "Dashboard + API" : response.default_output_mode === "dashboard" ? "Dashboard" : "API",
    notifications: { approval: response.notifications.approval_requested, approved: response.notifications.view_approved, expiry: response.notifications.ttl_expiring, audit: response.notifications.audit_events },
  };
}

export function WorkspaceSettingsScreen() {
  const { data, loading, error, demoFallback, reload, setData } = useAdminResource<WorkspaceSettings, ApiWorkspace>(adminEndpoints.workspace, workspaceFallback, normalizeWorkspace, emptyWorkspace);
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => setData((current) => ({ ...current, [key]: value }));
  const updateNotification = (key: keyof WorkspaceSettings["notifications"], value: boolean) => setData((current) => ({ ...current, notifications: { ...current.notifications, [key]: value } }));
  async function save() { setSaving(true); try { await sendAdminMutation(adminEndpoints.workspace, "PATCH", { name: data.name, region: data.region.includes("JP") ? "JP-13" : data.region.includes("VN") ? "VN-SG" : data.region === "Global" ? "GLOBAL" : "KR-11", default_ttl_days: Number.parseInt(data.ttl, 10) || 7, default_output_mode: data.output === "Dashboard + API" ? "dashboard_api" : data.output === "Dashboard" ? "dashboard" : "api" }); await sendAdminMutation(adminEndpoints.workspaceNotifications, "PATCH", { approval_requested: data.notifications.approval, view_approved: data.notifications.approved, ttl_expiring: data.notifications.expiry, audit_events: data.notifications.audit }); toast.success("워크스페이스 설정을 저장했습니다."); } catch { toast.error("설정 API에 연결하지 못했습니다. 변경 내용은 화면에 보존됩니다."); } finally { setSaving(false); } }
  return (
    <SettingsPage onSave={error && !demoFallback ? undefined : save} saving={saving}>
      <SettingsColumns>
        {demoFallback ? <ApiFallbackNotice onRetry={() => void reload()} /> : null}
        {loading ? <MiniSkeleton rows={4} /> : error && !demoFallback ? <AdminErrorState message={error} onRetry={() => void reload()} /> : <div className="space-y-3">
          <AdminPanel className="p-4"><SectionHeading description="Needex 전반에서 기본값으로 사용됩니다." title="워크스페이스 정보" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><SettingInput label="이름" onChange={(v) => update("name", v)} value={data.name} /><SettingInput label="기본 지역" onChange={(v) => update("region", v)} value={data.region} /><SettingInput label="기본 TTL" onChange={(v) => update("ttl", v)} value={data.ttl} /><SettingInput label="기본 출력 형태" onChange={(v) => update("output", v)} value={data.output} /></div></AdminPanel>
          <AdminPanel className="p-4"><SectionHeading description="승인과 만료처럼 놓치면 안 되는 이벤트만 기본 알림으로 둡니다." title="알림" /><div className="mt-5 space-y-4"><ToggleRow checked={data.notifications.approval} detail="Data Owner에게 즉시 알림" label="승인 요청 도착" onChange={(v) => updateNotification("approval", v)} /><ToggleRow checked={data.notifications.approved} detail="Requester에게 알림" label="Task View 승인 완료" onChange={(v) => updateNotification("approved", v)} /><ToggleRow checked={data.notifications.expiry} detail="Requester + Owner에게 알림" label="TTL 만료 24시간 전" onChange={(v) => updateNotification("expiry", v)} /><ToggleRow checked={data.notifications.audit} detail="실시간 알림 없음" label="일반 Audit 이벤트" onChange={(v) => updateNotification("audit", v)} /></div></AdminPanel>
          <AdminPanel className="border-tv-red-200 p-4"><SectionHeading description="나가기·삭제 BFF 계약이 추가되기 전에는 안전하게 비활성화됩니다." title="워크스페이스 관리" /><div className="mt-5 flex flex-wrap gap-2"><Button className="h-10 rounded-[10px]" disabled title="워크스페이스 나가기 API 준비 중" variant="outline">워크스페이스 나가기 · 준비 중</Button><Button className="h-10 rounded-[10px]" disabled title="워크스페이스 삭제 API 준비 중" variant="destructive">워크스페이스 삭제 · 준비 중</Button></div></AdminPanel>
        </div>}
      </SettingsColumns>
    </SettingsPage>
  );
}

function SettingInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { const id = useId(); return <label className="grid gap-2" htmlFor={id}><span className="text-[10px] font-medium text-tv-ink">{label}</span><Input className="h-10 rounded-[10px] text-[11px]" id={id} onChange={(e) => onChange(e.target.value)} type={type} value={value} /></label>; }
function ToggleRow({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) { return <div className="grid grid-cols-[180px_minmax(0,1fr)_auto] items-center gap-4 text-[10px]"><span className="font-medium text-tv-ink">{label}</span><span className="text-tv-slate">{detail}</span><Switch aria-label={label} checked={checked} onCheckedChange={onChange} /></div>; }

interface PolicySettings { newPurpose: boolean; highRisk: boolean; lowRisk: boolean; refinement: boolean; cumulative: boolean; block: boolean }
const policyFallback: PolicySettings = { newPurpose: true, highRisk: true, lowRisk: false, refinement: true, cumulative: true, block: true };
const emptyPolicy: PolicySettings = { newPurpose: false, highRisk: false, lowRisk: false, refinement: false, cumulative: false, block: false };
const rules = [["직접 식별자","name · phone · email","DENY","danger"],["상담 원문","raw_ticket_text","DENY","danger"],["상세 주소","exact_address","GENERALIZE","safe"],["최소 집단 크기","group_size","20 이상","success"],["최대 TTL","Task View lifetime","7 days","primary"]] as const;

export function PolicySettingsScreen() {
  const { data, loading, error, demoFallback, reload, setData } = useAdminResource<PolicySettings>(adminEndpoints.policy, policyFallback, undefined, emptyPolicy);
  const [saving, setSaving] = useState(false);
  const update = (key: keyof PolicySettings, value: boolean) => setData((current) => ({ ...current, [key]: value }));
  async function save() { setSaving(true); try { await sendAdminMutation(adminEndpoints.policy, "PATCH", data); toast.success("Privacy & Policy 규칙을 저장했습니다."); } catch { toast.error("Policy API에 연결하지 못했습니다."); } finally { setSaving(false); } }
  return <SettingsPage onSave={error && !demoFallback ? undefined : save} saving={saving}><SettingsColumns>{demoFallback ? <ApiFallbackNotice onRetry={() => void reload()} /> : null}{loading ? <MiniSkeleton rows={5} /> : error && !demoFallback ? <AdminErrorState message={error} onRetry={() => void reload()} /> : <div><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-[21px] font-bold text-tv-ink">Privacy & Policy</h2><p className="mt-1 text-[11px] text-tv-gray">AI가 아닌 결정론적 규칙이 실제 공개 가능 범위를 집행합니다.</p></div><AdminBadge tone="danger">ADMIN ONLY</AdminBadge></div><AdminPanel className="p-4"><SectionHeading description="모든 Task View에 적용되는 기본값입니다." title="기본 공개 규칙" /><div className="mt-4 divide-y divide-tv-border">{rules.map(([label, field, result, tone]) => <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-2 text-[10px] sm:min-h-11 sm:grid-cols-[160px_minmax(0,1fr)_120px_auto] sm:gap-4 sm:py-0" key={label}><span className="min-w-0 font-medium">{label}</span><code className="min-w-0 max-w-[150px] truncate justify-self-end font-mono text-tv-gray sm:max-w-none sm:justify-self-auto">{field}</code><AdminBadge className="h-5 justify-self-start" tone={tone}>{result}</AdminBadge><Button className="h-7 justify-self-end text-[9px] text-tv-blue-600" disabled title="개별 규칙 수정 API 준비 중" variant="outline"><Pencil className="size-3" />수정 · 준비 중</Button></div>)}</div></AdminPanel><div className="mt-3 grid gap-3 lg:grid-cols-2"><AdminPanel className="p-4"><SectionHeading description="신규 목적 또는 위험 요청의 사람 검토 기준" title="승인 동작" /><div className="mt-5 space-y-5"><ToggleRow checked={data.newPurpose} detail="Data Owner 승인 필요" label="신규 Purpose" onChange={(v) => update("newPurpose", v)} /><ToggleRow checked={data.highRisk} detail="항상 승인 필요" label="고위험 변환" onChange={(v) => update("highRisk", v)} /><ToggleRow checked={data.lowRisk} detail="자동 승인 허용" label="검증된 저위험 템플릿" onChange={(v) => update("lowRisk", v)} /></div></AdminPanel><AdminPanel className="p-4"><SectionHeading action={<AdminBadge tone="success">ACTIVE</AdminBadge>} description="과거 발급 View와 신규 요청의 결합 위험을 검사합니다." title="Inference Firewall" /><div className="mt-5 space-y-5"><ToggleRow checked={data.refinement} detail="" label="반복 세분화 추적" onChange={(v) => update("refinement", v)} /><ToggleRow checked={data.cumulative} detail="" label="동일 대상 누적 공개 추적" onChange={(v) => update("cumulative", v)} /><ToggleRow checked={data.block} detail="" label="위험 결합 시 자동 차단" onChange={(v) => update("block", v)} /></div><div className="mt-4 rounded-[8px] bg-tv-blue-50 px-3 py-2 text-[9px] text-tv-blue-600">Disclosure Ledger가 모든 결합 위험 검사를 기록합니다.</div></AdminPanel></div><AdminPanel className="mt-3 flex items-center justify-between gap-4 bg-tv-canvas p-4"><div><h3 className="text-[13px] font-bold">고급 Policy Engine 설정</h3><p className="mt-1 text-[9px] text-tv-gray">OPA/Rego 또는 JSON Rule Engine 원본은 개발자 모드에서 확인할 수 있습니다.</p></div><Button className="h-9 text-[10px]" disabled title="고급 정책 API 준비 중" variant="outline">고급 정책 · 준비 중<ArrowRight className="size-3.5" /></Button></AdminPanel></div>}</SettingsColumns></SettingsPage>;
}

interface TeamMember { id: string; initial: string; name: string; email: string; role: string; region: string; status: string }
interface ApiTeamMember { id: string; display_name: string; email: string; role: "requester" | "data_owner" | "admin"; region: string; status: "active" }
const teamFallback: TeamMember[] = [
  { id: "1", initial: "김", name: "김프로덕트", email: "product@company.com", role: "Product / UX", region: "Seoul · KR", status: "ACTIVE" },
  { id: "2", initial: "T", name: "Tokyo Owner", email: "owner.jp@company.com", role: "Data Owner", region: "Tokyo · JP", status: "ACTIVE" },
  { id: "3", initial: "H", name: "HCMC Owner", email: "owner.vn@company.com", role: "Data Owner", region: "HCMC · VN", status: "ACTIVE" },
  { id: "4", initial: "S", name: "Security Admin", email: "security@company.com", role: "Security / Admin", region: "Seoul · KR", status: "ACTIVE" },
  { id: "5", initial: "U", name: "UX Researcher", email: "ux@company.com", role: "Product / UX", region: "Seoul · KR", status: "ACTIVE" },
];
function normalizeMembers(response: ApiTeamMember[]): TeamMember[] { if (!Array.isArray(response)) return []; return response.map((member) => ({ id: member.id, initial: member.display_name.slice(0, 1).toUpperCase(), name: member.display_name, email: member.email, role: member.role === "data_owner" ? "Data Owner" : member.role === "admin" ? "Security / Admin" : "Product / UX", region: member.region, status: member.status.toUpperCase() })); }

export function TeamSettingsScreen() {
  const { data, loading, error, demoFallback, reload } = useAdminResource<TeamMember[], ApiTeamMember[]>(adminEndpoints.team, teamFallback, normalizeMembers);
  const { data: workspace, error: workspaceError } = useAdminResource<{ id: string }, { id: string }>(adminEndpoints.workspace, { id: "current" }, undefined, { id: "" });
  const [inviteOpen, setInviteOpen] = useState(false); const [email, setEmail] = useState(""); const [role, setRole] = useState("Product / UX");
  async function invite() { if (!workspace.id) { toast.error("워크스페이스 정보를 불러온 뒤 다시 시도해 주세요."); return; } try { await sendAdminMutation(`/api/workspaces/${encodeURIComponent(workspace.id)}/invitations`, "POST", { invitations: [{ email, role: role === "Data Owner" ? "data_owner" : role === "Security / Admin" ? "admin" : "requester" }] }); toast.success(`${email} 님에게 초대를 보냈습니다.`); setInviteOpen(false); setEmail(""); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "초대 API에 연결하지 못했습니다."); } }
  const roleCards = [["Product / UX","Task View 요청·분석"],["Data Owner","고위험 요청 승인"],["Security / Admin","Policy·Audit 관리"]] as const;
  const owners = data.filter((member) => member.role === "Data Owner");
  return <SettingsPage><SettingsColumns>{demoFallback ? <ApiFallbackNotice onRetry={() => void reload()} /> : null}{loading ? <MiniSkeleton rows={5} /> : error && !demoFallback ? <AdminErrorState message={error} onRetry={() => void reload()} /> : <><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-[21px] font-bold">Team & Roles</h2><p className="mt-1 text-[11px] text-tv-gray">누가 데이터를 요청하고, 누가 승인하며, 누가 정책을 관리하는지 역할을 분리합니다.</p></div><Dialog onOpenChange={setInviteOpen} open={inviteOpen}><DialogTrigger asChild><Button className="h-10 rounded-[10px] px-4 text-[11px]" disabled={Boolean(workspaceError || !workspace.id)} title={workspaceError ? "워크스페이스 정보를 불러오지 못했습니다." : undefined}><Plus className="size-4" />팀원 초대</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>팀원 초대</DialogTitle><DialogDescription>이메일과 역할을 지정하면 초대 링크가 발송됩니다.</DialogDescription></DialogHeader><SettingInput label="이메일" onChange={setEmail} value={email} /><label className="grid gap-2 text-[10px]">역할<Select onValueChange={setRole} value={role}><SelectTrigger aria-label="초대 역할" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Product / UX">Product / UX</SelectItem><SelectItem value="Data Owner">Data Owner</SelectItem><SelectItem value="Security / Admin">Security / Admin</SelectItem></SelectContent></Select></label><DialogFooter><Button disabled={!email.includes("@")} onClick={() => void invite()}>초대 보내기</Button></DialogFooter></DialogContent></Dialog></div><div className="grid gap-3 md:grid-cols-3">{roleCards.map(([title, detail]) => <AdminPanel className="p-4" key={title}><div className="flex justify-between"><strong className="text-[11px]">{title}</strong><AdminBadge className="h-5" tone="primary">{data.filter((member) => member.role === title).length}명</AdminBadge></div><p className="mt-3 text-[9px] text-tv-gray">{detail}</p><Button className="mt-3 h-8 text-[10px] text-tv-blue-600" disabled title="역할 상세 API 준비 중" variant="secondary">권한 보기 · 준비 중</Button></AdminPanel>)}</div><AdminPanel className="mt-3 overflow-hidden"><div className="flex items-center gap-3 p-4"><h3 className="text-[14px] font-bold">멤버</h3><span className="text-[9px] text-tv-slate">{data.length}명</span></div>{data.length ? <div className="overflow-x-auto"><div className="min-w-[700px]"><div className="grid h-10 grid-cols-[1fr_180px_120px_100px_24px] items-center bg-tv-canvas px-4 text-[8px] font-bold text-tv-slate"><span>MEMBER</span><span>ROLE</span><span>REGION</span><span>STATUS</span><span /></div>{data.map((member) => <div className="grid h-[58px] grid-cols-[1fr_180px_120px_100px_24px] items-center border-t border-tv-border px-4 text-[9px]" key={member.id}><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-tv-blue-50 font-semibold text-tv-blue-600">{member.initial}</span><span><strong className="block text-[10px]">{member.name}</strong><small className="text-[8px] text-tv-slate">{member.email}</small></span></div><span>{member.role}</span><span className="text-tv-gray">{member.region}</span><AdminBadge className="h-5 text-[8px]" tone="success">{member.status}</AdminBadge><MoreHorizontal aria-label="멤버 작업 준비 중" className="size-4 text-tv-slate" /></div>)}</div></div> : <AdminEmptyState description="초대가 수락되면 멤버가 이곳에 표시됩니다." title="워크스페이스 멤버가 없습니다." />}</AdminPanel><AdminPanel className="mt-3 flex items-center justify-between gap-4 p-4"><div><h3 className="text-[13px] font-bold">Approval Ownership</h3><p className="mt-1 text-[9px] text-tv-gray">{owners.length ? `현재 Data Owner: ${owners.map((owner) => owner.name).join(", ")}` : "Data Owner 역할을 가진 멤버를 지정해 주세요."}</p></div><AdminBadge tone={owners.length ? "success" : "warning"}>{owners.length} owners configured</AdminBadge></AdminPanel></>}</SettingsColumns></SettingsPage>;
}

interface IntegrationSettings { keyMasked: string; lastUsed: string; webhooks: Array<{ event: string; url: string }> }
const integrationFallback: IntegrationSettings = { keyMasked: "tv_live_••••••••••••8J2A", lastUsed: "12분 전", webhooks: [{ event: "view.created", url: "https://example.com/taskview" }, { event: "approval.requested", url: "https://example.com/taskview" }, { event: "view.expired", url: "https://example.com/taskview" }] };
const emptyIntegrations: IntegrationSettings = { keyMasked: "", lastUsed: "", webhooks: [] };

export function IntegrationsSettingsScreen() {
  const { data, loading, error, demoFallback, reload } = useAdminResource<IntegrationSettings>(adminEndpoints.integrations, integrationFallback, undefined, emptyIntegrations);
  async function createKey() { try { const result = await sendAdminMutation<{ secret?: string }>(`${adminEndpoints.integrations}/keys`, "POST"); toast.success(result.secret ? `새 키: ${result.secret}` : "새 API 키를 생성했습니다. 키는 지금 한 번만 확인할 수 있습니다.", { duration: 10000 }); } catch { toast.error("API 키 생성 endpoint가 아직 준비되지 않았습니다."); } }
  async function copy(value: string) { await navigator.clipboard.writeText(value); toast.success("클립보드에 복사했습니다."); }
  return <SettingsPage><SettingsColumns>{demoFallback ? <ApiFallbackNotice onRetry={() => void reload()} /> : null}<div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-[21px] font-bold">API & Integrations</h2><p className="mt-1 text-[11px] text-tv-gray">Task View를 앱·분석 도구·자동화에서 재사용할 수 있도록 제한된 인터페이스를 제공합니다.</p></div><Button className="h-10 text-[10px]" disabled title="API 문서 라우트 준비 중" variant="outline">API 문서 · 준비 중<ExternalLink className="size-3.5" /></Button></div>{loading ? <MiniSkeleton rows={4} /> : error && !demoFallback ? <AdminErrorState message={error} onRetry={() => void reload()} /> : <div className="space-y-3"><AdminPanel className="p-4"><SectionHeading description="키는 Task View 출력에만 접근하며 원본 DB 권한을 상속하지 않습니다." title="API Keys" />{data.keyMasked ? <div className="mt-4 flex flex-col justify-between gap-4 rounded-[10px] bg-tv-canvas p-4 sm:flex-row sm:items-center"><div><strong className="block text-[11px]">Production Key</strong><code className="mt-1 block font-mono text-[9px] text-tv-gray">{data.keyMasked}</code></div><div className="flex items-center gap-4"><AdminBadge tone="success">ACTIVE</AdminBadge><span className="text-[8px] text-tv-slate">최근 사용 {data.lastUsed}</span></div></div> : <p className="mt-4 text-[10px] text-tv-gray">생성된 API 키가 없습니다.</p>}<Button className="mt-3 h-8 text-[10px]" onClick={() => void createKey()} variant="outline"><Plus className="size-3.5" />새 키 생성</Button></AdminPanel><AdminPanel className="p-4"><SectionHeading title="Task View Endpoint" /><div className="mt-4 space-y-3">{[["REST API","GET /v1/taskviews/{id}/data"],["Schema","GET /v1/taskviews/{id}/artifacts"],["SQL Access","Evidence-scoped artifact"]].map(([label, value]) => <div className="grid min-h-10 grid-cols-[90px_minmax(0,1fr)_70px] items-center gap-4 text-[9px]" key={label}><strong>{label}</strong><code className="truncate rounded-[6px] bg-tv-canvas p-2 font-mono text-tv-gray">{value}</code><Button aria-label={`${label} 복사`} className="h-8 text-[9px]" onClick={() => void copy(value)} variant="outline"><Clipboard className="size-3" />복사</Button></div>)}</div><div className="mt-3 flex items-center gap-3"><AdminBadge className="h-5" tone="primary">TTL enforced</AdminBadge><span className="text-[8px] text-tv-slate">만료 후 동일 endpoint는 자동 비활성화됩니다.</span></div></AdminPanel><div className="grid gap-3 lg:grid-cols-2"><AdminPanel className="p-4"><SectionHeading title="Webhooks" />{data.webhooks.length ? <div className="mt-4 space-y-3">{data.webhooks.map((hook) => <div className="grid grid-cols-[110px_1fr] gap-3 text-[8px]" key={hook.event}><AdminBadge className="h-5" tone="primary">{hook.event}</AdminBadge><span className="truncate text-tv-slate">{hook.url}</span></div>)}</div> : <p className="mt-4 text-[10px] text-tv-gray">등록된 Webhook이 없습니다.</p>}</AdminPanel><AdminPanel className="p-4"><SectionHeading action={<AdminBadge tone="warning">CONTROLLED</AdminBadge>} title="Export Policy" /><DefinitionRows className="mt-4" rows={[["Dashboard",<span className="text-tv-green-700" key="a">ALLOW</span>],["API",<span className="text-tv-green-700" key="b">ALLOW</span>],["CSV export",<span className="text-tv-amber-700" key="c">OWNER APPROVAL</span>],["Raw PII",<span className="text-tv-red-700" key="d">DENY</span>]]} /></AdminPanel></div></div>}</SettingsColumns></SettingsPage>;
}

interface AccountPayload { name: string; email: string; verified: boolean; passwordChanged: string; sessions: Array<{ id: string; name: string; device: string; when: string; current: boolean }> }
const accountFallback: AccountPayload = { name: "김프로덕트", email: "product@company.com", verified: true, passwordChanged: "32일 전", sessions: [{ id: "current", name: "현재 세션", device: "Chrome · Windows · Seoul", when: "지금", current: true }, { id: "safari", name: "다른 세션", device: "Safari · macOS · Seoul", when: "2일 전", current: false }] };
const emptyAccount: AccountPayload = { name: "", email: "", verified: false, passwordChanged: "", sessions: [] };

export function AccountSecurityScreen() {
  const { logout } = useSession();
  const { data, loading, error, demoFallback, reload, setData } = useAdminResource<AccountPayload>(adminEndpoints.account, accountFallback, undefined, emptyAccount);
  const [saving, setSaving] = useState(false);
  async function saveProfile() { setSaving(true); try { await sendAdminMutation(adminEndpoints.account, "PATCH", { name: data.name }); toast.success("프로필을 저장했습니다."); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "계정 API에 연결하지 못했습니다."); } finally { setSaving(false); } }
  return <AdminPage><PageTitle action={error && !demoFallback ? undefined : <Button className="h-[42px] rounded-[10px] px-5 text-[12px]" disabled={saving} onClick={() => void saveProfile()}>{saving ? "저장 중…" : "변경사항 저장"}</Button>} description="개인 프로필과 로그인 보안을 관리합니다." title="설정" /><SettingsColumns account>{demoFallback ? <ApiFallbackNotice onRetry={() => void reload()} /> : null}<div className="mb-4"><h2 className="text-[21px] font-bold">내 계정 & 보안</h2><p className="mt-1 text-[11px] text-tv-gray">개인 프로필과 로그인 보안은 워크스페이스 데이터 정책과 별도로 관리합니다.</p></div>{loading ? <MiniSkeleton rows={4} /> : error && !demoFallback ? <AdminErrorState message={error} onRetry={() => void reload()} /> : <div className="space-y-3"><AdminPanel className="p-4" id="profile"><SectionHeading title="프로필" /><div className="mt-4 grid items-end gap-4 md:grid-cols-[56px_1fr_1fr_auto]"><span className="grid size-14 place-items-center rounded-full bg-tv-blue-50 text-xl font-bold text-tv-blue-600">{data.name.slice(0, 1).toUpperCase() || "U"}</span><SettingInput label="이름" onChange={(v) => setData((current) => ({ ...current, name: v }))} value={data.name} /><label className="grid gap-2"><span className="text-[10px]">이메일</span><Input className="h-10" disabled value={data.email} /><span className={data.verified ? "text-[8px] text-tv-green-700" : "text-[8px] text-tv-amber-700"}>{data.verified ? "✓ 인증됨" : "인증 필요"}</span></label><Button className="h-10" disabled={!data.name.trim() || saving} onClick={() => void saveProfile()}>프로필 저장</Button></div></AdminPanel><AdminPanel className="p-4" id="security"><SectionHeading title="로그인 & 보안" /><div className="mt-4 rounded-[10px] bg-tv-canvas p-3"><div className="flex items-center justify-between"><span><strong className="block text-[10px]">이메일 + 비밀번호</strong><small className="text-[8px] text-tv-slate">계정의 현재 인증 상태</small></span><AdminBadge tone={data.verified ? "success" : "warning"}>{data.verified ? "VERIFIED" : "VERIFY"}</AdminBadge></div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px]"><span>비밀번호 <small className="ml-6 text-tv-slate">마지막 변경 {data.passwordChanged || "정보 없음"}</small></span><Button className="h-9" disabled title="로그인된 계정의 비밀번호 변경 API 준비 중" variant="outline"><Lock className="size-3.5" />변경 · 준비 중</Button></div></AdminPanel><AdminPanel className="p-4"><SectionHeading title="활성 세션" />{data.sessions.length ? <div className="mt-4 divide-y divide-tv-border">{data.sessions.map((session) => <div className="grid min-h-[52px] gap-3 text-[9px] sm:grid-cols-[120px_1fr_80px_150px] sm:items-center" key={session.id}><strong>{session.name}</strong><span className="text-tv-gray">{session.device}</span><span className="text-tv-slate">{session.when}</span>{session.current ? <AdminBadge className="h-5 justify-self-start" tone="success">CURRENT</AdminBadge> : <Button className="h-8 text-[9px]" disabled title="세션 종료 BFF 준비 중" variant="destructive">세션 종료 · 준비 중</Button>}</div>)}</div> : <AdminEmptyState description="세션 API가 반환한 활성 세션이 없습니다." title="활성 세션이 없습니다." />}</AdminPanel><Button className="h-10 w-full text-[10px]" onClick={() => void logout()} variant="destructive"><LogOut className="size-3.5" />로그아웃</Button></div>}</SettingsColumns></AdminPage>;
}
