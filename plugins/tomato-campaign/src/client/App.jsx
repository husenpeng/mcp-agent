/**
 * The campaign workspace panel: the campaign list, one campaign's workspace
 * (role cards, roster, details, outreach), and the outreach inbox.
 *
 * Every view reads through `api.js`, which calls the host proxy; the page holds
 * no business rule of its own beyond display mapping and the confirmation a
 * write action needs before it reaches campaign-manager.
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ApiError, createCampaign, createRoleCard, fetchCampaign, fetchCampaigns, fetchPendingOutreach,
  fetchRoleCards, fetchRoster, fetchSearchReport, fetchStatus, fetchThreads, importFeishuRoster,
  removeCreator, replyToThread, startSearchTask, updateCampaign,
} from './api.js'

/** Campaign status vocabulary the service writes today. */
const STATUS = {
  draft: ['草稿', 'muted'],
  strategy: ['策略', 'info'],
  outreach: ['建联', 'primary'],
  completed: ['已完成', 'ok'],
  archived: ['已归档', 'muted'],
}

/** Recruit tier vocabulary. */
const TIER = { head: '头部', mid: '腰部', tail: '尾部', manual: '手动' }

/** Platform display names; unknown values render as written. */
const PLATFORM = {
  instagram: 'Instagram',
  'instagram（reels）': 'IG Reels',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X',
  twitter: 'X',
}

/** Outreach stage vocabulary on a roster row. */
const OUTREACH = {
  not_contacted: '未联系',
  shortlisted: '已入库',
  negotiating: '洽谈中',
  quoted: '已报价',
  signed: '已签约',
  rejected: '已拒绝',
}

/** Country names for the codes campaigns and rosters carry. */
const COUNTRY = {
  FR: '法国', GB: '英国', US: '美国', JP: '日本', MX: '墨西哥', DE: '德国', ES: '西班牙',
  IT: '意大利', BR: '巴西', KR: '韩国', SA: '沙特', AE: '阿联酋', CA: '加拿大', AU: '澳大利亚',
  NO: '挪威', SE: '瑞典', NL: '荷兰', PL: '波兰', IN: '印度', ID: '印尼', TH: '泰国',
  VN: '越南', PH: '菲律宾', MY: '马来西亚', SG: '新加坡', TR: '土耳其', RU: '俄罗斯', CN: '中国',
}

/** Rows the list and the roster request per page. */
const PAGE_SIZE = 20

/** Read an array out of either payload family. */
function itemsOf(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.items)) return data.items
  if (data && Array.isArray(data.list)) return data.list
  return []
}

/** Total out of a paged payload, falling back to the loaded rows. */
function totalOf(data, rows) {
  return typeof data?.total === 'number' ? data.total : rows.length
}

/** Human date out of an ISO field, or the raw value. */
function when(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  const day = `${date.getMonth() + 1} 月 ${date.getDate()} 日`
  return sameYear ? day : `${date.getFullYear()} 年 ${day}`
}

/** Compact count: 3.06 万 / 1.20 亿. */
function compact(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  if (number >= 1e8) return `${(number / 1e8).toFixed(2)} 亿`
  if (number >= 1e4) return `${(number / 1e4).toFixed(number >= 1e6 ? 0 : 1)} 万`
  return String(Math.round(number))
}

/** Percentage out of a ratio. */
function percent(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  const ratio = number > 1 ? number / 100 : number
  if (ratio === 0) return '0%'
  return `${(ratio * 100).toFixed(ratio < 0.01 ? 2 : 1)}%`
}

/** Budget text out of the structured budget field. */
function money(budget) {
  if (budget === null || budget === undefined) return '未设置'
  if (typeof budget === 'string') return budget
  if (typeof budget !== 'object') return '未设置'
  const { min, max, currency, tier } = budget
  const unit = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : currency === 'EUR' ? '€' : ''
  const bound = value => `${unit}${compact(value)}`
  const hasMin = min !== null && min !== undefined
  const hasMax = max !== null && max !== undefined
  if (hasMin && hasMax) return `${bound(min)} – ${bound(max)}`
  if (hasMin) return `${bound(min)} 起`
  if (hasMax) return `≤ ${bound(max)}`
  return tier ?? '未设置'
}

/** Display name for a platform code. */
function platformName(code) {
  return PLATFORM[code] ?? String(code ?? '')
}

/** Country name for an ISO code, or the code itself. */
function countryName(code) {
  return COUNTRY[code] ? `${COUNTRY[code]} ${code}` : code
}

/** Stable avatar hue for a name. */
function hueOf(text) {
  let hash = 0
  const value = String(text ?? '')
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) % 360
  return hash
}

/** One status pill. */
function StatusPill({ status }) {
  const [label, tone] = STATUS[status] ?? [status ?? '未知', 'muted']
  return <span className={`tcw-pill ${tone}`}>{label}</span>
}

/** One neutral tag. */
function Tag({ children, tone }) {
  return <span className={`tcw-tag ${tone ?? ''}`}>{children}</span>
}

/** Avatar with the entity's first character when no image is available. */
function Avatar({ name, src, size }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) }
  if (src) return <img className="tcw-avatar" style={style} src={src} alt="" loading="lazy" />
  const initial = String(name ?? '?').trim().slice(0, 1).toUpperCase() || '?'
  return <span className="tcw-avatar text" style={{ ...style, background: `hsl(${hueOf(name)} 46% 42%)` }}>{initial}</span>
}

/** Field wrapper for every dialog input. */
function Field({ label, hint, children }) {
  return (
    <label className="tcw-field">
      <span className="tcw-field-label">{label}</span>
      {children}
      {hint ? <span className="tcw-field-hint">{hint}</span> : null}
    </label>
  )
}

/** Modal frame shared by the dialogs and the report. */
function Dialog({ title, subtitle, children, footer, onClose, wide }) {
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="tcw-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`tcw-modal-card ${wide ? 'wide' : ''}`}>
        <header className="tcw-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="tcw-x" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <div className="tcw-modal-body">{children}</div>
        {footer ? <footer className="tcw-modal-foot">{footer}</footer> : null}
      </div>
    </div>
  )
}

/** Signed-out banner shared by every view. */
function SignedOut({ configured }) {
  return (
    <div className="tcw-empty big">
      <p>{configured ? '还没有登录公司账号。' : '公司 BFF 未配置。'}</p>
      <p className="tcw-small">在 Settings → Account 用飞书登录后，这里会显示活动与达人数据。</p>
    </div>
  )
}

/** Status counts above the list. */
function ListSummary({ rows, total }) {
  const counts = useMemo(() => {
    const map = { draft: 0, strategy: 0, outreach: 0, completed: 0 }
    for (const row of rows) if (map[row.status] !== undefined) map[row.status] += 1
    return map
  }, [rows])
  return (
    <div className="tcw-summary">
      <span><b>{total}</b> 个活动 · 已加载 {rows.length}</span>
      {Object.entries(counts).map(([key, value]) => (
        <span key={key} className="tcw-summary-item">
          <StatusPill status={key} />
          <b>{value}</b>
        </span>
      ))}
    </div>
  )
}

/** Campaign list with search, filters, sorting, and paging. */
function CampaignList({ signedIn, configured, onOpen, onCreate, version }) {
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [platform, setPlatform] = useState('')
  const [market, setMarket] = useState('')
  const [sort, setSort] = useState('updated')
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async (nextPage, append) => {
    if (!signedIn) return
    setLoading(true)
    setError(null)
    try {
      const payload = await fetchCampaigns({
        keyword: query || undefined,
        status: status || undefined,
        page: nextPage,
        pageSize: PAGE_SIZE,
      })
      setData(previous => (append && previous ? { ...payload, items: [...itemsOf(previous), ...itemsOf(payload)] } : payload))
      setPage(nextPage)
    } catch (cause) {
      setError(cause)
    } finally {
      setLoading(false)
    }
  }, [query, status, signedIn])

  useEffect(() => { void load(1, false) }, [load, version])

  const rows = useMemo(() => itemsOf(data), [data])
  const filtered = useMemo(() => {
    const match = row => {
      if (platform && !(row.platformFocus ?? []).includes(platform)) return false
      if (market && !(row.market ?? []).includes(market)) return false
      return true
    }
    const list = rows.filter(match)
    if (sort === 'creators') return [...list].sort((left, right) => (right.creatorCount ?? 0) - (left.creatorCount ?? 0))
    if (sort === 'name') return [...list].sort((left, right) => String(left.name ?? '').localeCompare(String(right.name ?? ''), 'zh'))
    return [...list].sort((left, right) => String(right.updatedAt ?? '').localeCompare(String(left.updatedAt ?? '')))
  }, [rows, platform, market, sort])

  const platforms = useMemo(() => {
    const set = new Set()
    for (const row of rows) for (const code of row.platformFocus ?? []) set.add(code)
    return [...set].sort()
  }, [rows])
  const markets = useMemo(() => {
    const set = new Set()
    for (const row of rows) for (const code of row.market ?? []) set.add(code)
    return [...set].sort()
  }, [rows])

  if (!signedIn) return <SignedOut configured={configured} />

  const total = totalOf(data, rows)

  return (
    <div className="tcw-inner">
      <div className="tcw-head">
        <div>
          <h1>活动</h1>
          <ListSummary rows={rows} total={total} />
        </div>
        <div className="tcw-actions">
          <button className="tcw-btn primary" onClick={onCreate}>新建活动</button>
          <button className="tcw-btn" onClick={() => void load(1, false)} disabled={loading}>{loading ? '刷新中…' : '刷新'}</button>
        </div>
      </div>

      <div className="tcw-toolbar">
        <input
          className="tcw-input search"
          placeholder="搜索活动名称、品牌、目标"
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') setQuery(keyword.trim()) }}
        />
        <button className="tcw-btn" onClick={() => setQuery(keyword.trim())}>搜索</button>
        <span className="tcw-spacer" />
        <select className="tcw-select" value={status} onChange={event => setStatus(event.target.value)} aria-label="按状态筛选">
          <option value="">全部状态</option>
          {Object.entries(STATUS).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select className="tcw-select" value={platform} onChange={event => setPlatform(event.target.value)} aria-label="按平台筛选">
          <option value="">全部平台</option>
          {platforms.map(code => <option key={code} value={code}>{platformName(code)}</option>)}
        </select>
        <select className="tcw-select" value={market} onChange={event => setMarket(event.target.value)} aria-label="按市场筛选">
          <option value="">全部市场</option>
          {markets.map(code => <option key={code} value={code}>{countryName(code)}</option>)}
        </select>
        <select className="tcw-select" value={sort} onChange={event => setSort(event.target.value)} aria-label="排序">
          <option value="updated">最近更新</option>
          <option value="creators">达人最多</option>
          <option value="name">名称</option>
        </select>
      </div>

      {error ? <div className="tcw-error">{error.message}</div> : null}

      <div className="tcw-card flush">
        <table className="tcw-table">
          <thead>
            <tr>
              <th className="col-name">活动</th>
              <th>状态</th>
              <th>市场</th>
              <th>平台</th>
              <th className="col-budget">预算</th>
              <th className="num col-creators">达人</th>
              <th className="col-time">更新于</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} className="clickable" onClick={() => onOpen(row.id)}>
                <td>
                  <div className="tcw-name">
                    <Avatar name={row.brand ?? row.name} size={34} />
                    <div className="tcw-name-body">
                      <b>{row.name ?? '未命名活动'}</b>
                      <span>{[row.brand, row.category, row.goal].filter(Boolean).join(' · ') || '没有填写品牌与品类'}</span>
                    </div>
                  </div>
                </td>
                <td><StatusPill status={row.status} /></td>
                <td>
                  <div className="tcw-tags">
                    {(row.market ?? []).length === 0 ? <span className="tcw-muted">—</span> : null}
                    {(row.market ?? []).map(code => <Tag key={code}>{countryName(code)}</Tag>)}
                  </div>
                </td>
                <td>
                  <div className="tcw-tags">
                    {(row.platformFocus ?? []).length === 0 ? <span className="tcw-muted">—</span> : null}
                    {(row.platformFocus ?? []).map(code => <Tag key={code} tone="alt">{platformName(code)}</Tag>)}
                  </div>
                </td>
                <td className="tcw-muted nowrap">{money(row.budget)}</td>
                <td className="num">
                  <b>{row.creatorCount ?? 0}</b>
                  <span className="tcw-sub-inline">{row.recruitTarget?.total ? `目标 ${row.recruitTarget.total}` : '未设目标'}</span>
                  {row.creatorTierStats
                    ? (
                      <span className="tcw-sub-inline">
                        头 {row.creatorTierStats.head ?? 0} · 腰 {row.creatorTierStats.mid ?? 0} · 尾 {row.creatorTierStats.tail ?? 0}
                      </span>
                    )
                    : null}
                </td>
                <td className="tcw-muted col-time">{when(row.updatedAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && !loading
              ? <tr><td colSpan={7}><div className="tcw-empty">{rows.length === 0 ? '还没有活动。' : '当前筛选没有命中。'}</div></td></tr>
              : null}
            {loading && rows.length === 0
              ? [0, 1, 2].map(index => <tr key={`skeleton-${index}`} className="skeleton"><td colSpan={7}><span className="tcw-skeleton" /></td></tr>)
              : null}
          </tbody>
        </table>
      </div>

      <div className="tcw-list-foot">
        <span className="tcw-small tcw-muted">已显示 {filtered.length} / {total}</span>
        <span className="tcw-spacer" />
        {rows.length < total
          ? <button className="tcw-btn" onClick={() => void load(page + 1, true)} disabled={loading}>{loading ? '加载中…' : '加载更多'}</button>
          : null}
      </div>
    </div>
  )
}

/** One role card with its actions. */
function RoleCard({ card, onStart, onReport, busy }) {
  const platforms = (card.platforms ?? []).map(platformName)
  const countries = (card.country ?? []).map(code => COUNTRY[code] ?? code)
  return (
    <article className="tcw-rolecard">
      <header>
        <div className="r1">
          <b>{card.role ?? card.name ?? '角色卡'}</b>
          <Tag>{card.tier ?? '未分层'}</Tag>
        </div>
        <p className="tcw-small tcw-muted">
          {[card.category, card.vertical, card.creatorType].filter(Boolean).join(' · ') || '没有填写品类与垂类'}
        </p>
      </header>
      <dl>
        <dt>平台</dt><dd>{platforms.length ? platforms.join(' / ') : '—'}</dd>
        <dt>目标国家</dt><dd>{countries.length ? countries.join(' / ') : '—'}</dd>
        <dt>粉丝区间</dt><dd>{card.follow || card.followMax ? `${compact(card.follow)} – ${compact(card.followMax)}` : '—'}</dd>
        <dt>内容任务</dt><dd>{card.mission ?? '—'}</dd>
        <dt>受众</dt><dd>{card.audienceFit ?? '—'}</dd>
        <dt>商务信号</dt><dd>{card.commerceSignal ?? '—'}</dd>
        {card.exclusion ? <Fragment><dt>排除项</dt><dd>{card.exclusion}</dd></Fragment> : null}
      </dl>
      <footer>
        <span className={`tcw-pill ${card.taskId ? 'info' : 'muted'}`}>{card.taskId ? '已有推荐任务' : '未发起'}</span>
        <span className="tcw-spacer" />
        <button className="tcw-btn sm" disabled={busy || !card.taskId} onClick={() => onReport(card)}>查看报告</button>
        <button className="tcw-btn sm primary" disabled={busy} onClick={() => onStart(card)}>发起推荐</button>
      </footer>
    </article>
  )
}

/** Report dialog for one role card. */
function ReportDialog({ campaignId, card, onClose }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    let live = true
    fetchSearchReport(campaignId, card.id)
      .then(value => { if (live) setReport(value) })
      .catch(cause => { if (live) setError(cause) })
    return () => { live = false }
  }, [campaignId, card.id])

  const platforms = useMemo(() => Object.entries(report?.platforms ?? {}), [report])

  return (
    <Dialog
      title={`推荐报告 · ${card.role ?? '角色卡'}`}
      subtitle={report?.summary ? undefined : '读取最近一次推荐任务…'}
      wide
      onClose={onClose}
      footer={<button className="tcw-btn" onClick={onClose}>关闭</button>}
    >
      {error ? <div className="tcw-error">{error.message}</div> : null}
      {!report && !error ? <div className="tcw-empty">读取中…</div> : null}
      {report ? (
        <>
          {report.summary ? <p className="tcw-report-summary">{report.summary}</p> : null}
          {(report.assumptions ?? []).length > 0 ? (
            <details className="tcw-assumptions">
              <summary>口径与假设（{report.assumptions.length}）</summary>
              <ul>{report.assumptions.map((line, index) => <li key={index}>{line}</li>)}</ul>
            </details>
          ) : null}
          {platforms.map(([code, bucket]) => {
            const candidates = bucket?.candidates ?? []
            return (
              <section key={code} className="tcw-report-platform">
                <h3>
                  {platformName(code)}
                  <span className="tcw-small tcw-muted">候选 {candidates.length} 人</span>
                </h3>
                <table className="tcw-table compact">
                  <thead>
                    <tr><th className="num">#</th><th>达人</th><th className="num">粉丝</th><th className="num">互动率</th><th className="num">预估报价</th><th>推荐理由</th></tr>
                  </thead>
                  <tbody>
                    {candidates.map(candidate => (
                      <tr key={`${code}-${candidate.channel_id ?? candidate.rank}`}>
                        <td className="num">{candidate.rank ?? '—'}</td>
                        <td>
                          <div className="tcw-name tight">
                            <Avatar name={candidate.channel_title} src={candidate.profile?.avatarUrl} size={26} />
                            <div className="tcw-name-body">
                              <b>{candidate.channel_title ?? '—'}</b>
                              {candidate.profile?.profileUrl
                                ? <a href={candidate.profile.profileUrl} target="_blank" rel="noreferrer">{candidate.profile.handle ? `@${candidate.profile.handle}` : '主页'}</a>
                                : <span>{candidate.profile?.handle ? `@${candidate.profile.handle}` : ''}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="num">{compact(candidate.subscriber_count)}</td>
                        <td className="num">{percent(candidate.evidence?.metrics?.er)}</td>
                        <td className="num">{candidate.estimated_price ? `$${compact(candidate.estimated_price)}` : '—'}</td>
                        <td className="tcw-reason">{candidate.reason ?? '—'}</td>
                      </tr>
                    ))}
                    {candidates.length === 0 ? <tr><td colSpan={6}><div className="tcw-empty">这个平台没有候选。</div></td></tr> : null}
                  </tbody>
                </table>
              </section>
            )
          })}
        </>
      ) : null}
    </Dialog>
  )
}

/** Create-campaign dialog. */
function CreateCampaignDialog({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', brand: '', category: '', goal: '', market: '', platform: 'instagram', budgetMin: '', budgetMax: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = key => event => setForm(previous => ({ ...previous, [key]: event.target.value }))

  const submit = async () => {
    if (form.name.trim() === '' || form.brand.trim() === '') {
      setError(new ApiError('名称与品牌是必填项。', 0))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const body = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        ...form.category.trim() ? { category: form.category.trim() } : {},
        ...form.goal.trim() ? { goal: form.goal.trim() } : {},
        ...form.market.trim() ? { market: form.market.split(/[,，\s]+/).filter(Boolean).map(code => code.toUpperCase()) } : {},
        ...form.platform ? { platformFocus: [form.platform] } : {},
        ...(form.budgetMin.trim() || form.budgetMax.trim()) ? {
          budget: {
            min: form.budgetMin.trim() === '' ? null : Number(form.budgetMin),
            max: form.budgetMax.trim() === '' ? null : Number(form.budgetMax),
            currency: 'USD',
            tier: null,
          },
        } : {},
      }
      onCreated(await createCampaign(body))
    } catch (cause) {
      setError(cause)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="新建活动"
      subtitle="写进 campaign-manager；活动从草稿开始，阶段之后可在详情里改。"
      onClose={onClose}
      footer={(
        <>
          <span className="tcw-spacer" />
          <button className="tcw-btn" onClick={onClose} disabled={busy}>取消</button>
          <button className="tcw-btn primary" onClick={() => void submit()} disabled={busy}>{busy ? '创建中…' : '创建活动'}</button>
        </>
      )}
    >
      {error ? <div className="tcw-error">{error.message}</div> : null}
      <div className="tcw-grid2">
        <Field label="活动名称"><input className="tcw-input" value={form.name} onChange={set('name')} placeholder="品牌_目标_市场_季度" /></Field>
        <Field label="品牌"><input className="tcw-input" value={form.brand} onChange={set('brand')} placeholder="TCL" /></Field>
        <Field label="品类"><input className="tcw-input" value={form.category} onChange={set('category')} placeholder="3C科技/电视" /></Field>
        <Field label="营销目标"><input className="tcw-input" value={form.goal} onChange={set('goal')} placeholder="品牌曝光、带货转化" /></Field>
        <Field label="目标市场" hint="逗号分隔的国家码"><input className="tcw-input" value={form.market} onChange={set('market')} placeholder="FR, GB" /></Field>
        <Field label="主平台">
          <select className="tcw-select wide" value={form.platform} onChange={set('platform')}>
            {['instagram', 'youtube', 'tiktok', 'x'].map(code => <option key={code} value={code}>{platformName(code)}</option>)}
          </select>
        </Field>
        <Field label="预算下限（USD）"><input className="tcw-input" value={form.budgetMin} onChange={set('budgetMin')} inputMode="numeric" placeholder="400000" /></Field>
        <Field label="预算上限（USD）"><input className="tcw-input" value={form.budgetMax} onChange={set('budgetMax')} inputMode="numeric" placeholder="留空表示只有下限" /></Field>
      </div>
    </Dialog>
  )
}

/** Create-role-card dialog. */
function CreateCardDialog({ campaignId, onClose, onCreated }) {
  const [form, setForm] = useState({
    role: '', tier: 'Mid-tier', category: '', country: '', platforms: 'instagram', vertical: '', creatorType: '', mission: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = key => event => setForm(previous => ({ ...previous, [key]: event.target.value }))

  const submit = async () => {
    if (form.role.trim() === '') {
      setError(new ApiError('角色定位是必填项。', 0))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const card = {
        role: form.role.trim(),
        tier: form.tier,
        ...form.category.trim() ? { category: form.category.trim() } : {},
        ...form.country.trim() ? { country: form.country.split(/[,，\s]+/).filter(Boolean).map(code => code.toUpperCase()) } : {},
        ...form.platforms.trim() ? { platforms: form.platforms.split(/[,，\s]+/).filter(Boolean) } : {},
        ...form.vertical.trim() ? { vertical: form.vertical.trim() } : {},
        ...form.creatorType.trim() ? { creatorType: form.creatorType.trim() } : {},
        ...form.mission.trim() ? { mission: form.mission.trim() } : {},
      }
      onCreated(await createRoleCard(campaignId, card))
    } catch (cause) {
      setError(cause)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="新建角色卡"
      subtitle="角色卡决定推荐任务怎么找人；改卡会让旧报告作废。"
      onClose={onClose}
      footer={(
        <>
          <span className="tcw-spacer" />
          <button className="tcw-btn" onClick={onClose} disabled={busy}>取消</button>
          <button className="tcw-btn primary" onClick={() => void submit()} disabled={busy}>{busy ? '保存中…' : '创建角色卡'}</button>
        </>
      )}
    >
      {error ? <div className="tcw-error">{error.message}</div> : null}
      <div className="tcw-grid2">
        <Field label="角色定位"><input className="tcw-input" value={form.role} onChange={set('role')} placeholder="法英·家居场景种草位" /></Field>
        <Field label="达人层级">
          <select className="tcw-select wide" value={form.tier} onChange={set('tier')}>
            {['Head-tier', 'Mid-tier', 'Tail-tier'].map(tier => <option key={tier} value={tier}>{tier}</option>)}
          </select>
        </Field>
        <Field label="品类"><input className="tcw-input" value={form.category} onChange={set('category')} placeholder="3C科技/家居生活" /></Field>
        <Field label="垂类"><input className="tcw-input" value={form.vertical} onChange={set('vertical')} placeholder="客厅影音、智能家居" /></Field>
        <Field label="目标国家" hint="逗号分隔的国家码"><input className="tcw-input" value={form.country} onChange={set('country')} placeholder="FR, GB" /></Field>
        <Field label="平台" hint="逗号分隔"><input className="tcw-input" value={form.platforms} onChange={set('platforms')} placeholder="instagram, youtube" /></Field>
        <Field label="达人类型"><input className="tcw-input" value={form.creatorType} onChange={set('creatorType')} placeholder="生活方式型" /></Field>
        <Field label="内容任务"><input className="tcw-input" value={form.mission} onChange={set('mission')} placeholder="用客厅场景扩大曝光" /></Field>
      </div>
    </Dialog>
  )
}

/** Import-creators dialog. */
function ImportDialog({ campaignId, onClose, onDone }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (url.trim() === '') {
      setError(new ApiError('需要飞书多维表格链接。', 0))
      return
    }
    setBusy(true)
    setError(null)
    try {
      onDone(await importFeishuRoster(campaignId, url.trim()))
    } catch (cause) {
      setError(cause)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="从飞书导入达人"
      subtitle="异步任务；授权过期会被拒绝，需要先在 Settings → Account 重新授权。"
      onClose={onClose}
      footer={(
        <>
          <span className="tcw-spacer" />
          <button className="tcw-btn" onClick={onClose} disabled={busy}>取消</button>
          <button className="tcw-btn primary" onClick={() => void submit()} disabled={busy}>{busy ? '提交中…' : '开始导入'}</button>
        </>
      )}
    >
      {error ? <div className="tcw-error">{error.message}</div> : null}
      <Field label="飞书多维表格链接" hint="粘贴完整链接，不要只给 token">
        <input className="tcw-input" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://xxx.feishu.cn/base/..." />
      </Field>
    </Dialog>
  )
}

/** Roster tab: list, search, drill-down, and removal. */
function RosterTab({ campaignId, signedIn, onImport, version }) {
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [removing, setRemoving] = useState(false)

  const load = useCallback(async (nextPage, append) => {
    if (!signedIn) return
    setLoading(true)
    setError(null)
    try {
      const payload = await fetchRoster(campaignId, { keyword: query || undefined, page: nextPage, pageSize: PAGE_SIZE })
      setData(previous => (append && previous ? { ...payload, items: [...itemsOf(previous), ...itemsOf(payload)] } : payload))
      setPage(nextPage)
    } catch (cause) {
      setError(cause)
    } finally {
      setLoading(false)
    }
  }, [campaignId, query, signedIn])

  useEffect(() => { void load(1, false) }, [load, version])

  const rows = useMemo(() => itemsOf(data), [data])
  const total = totalOf(data, rows)

  const remove = async () => {
    if (!selected) return
    setRemoving(true)
    setError(null)
    try {
      await removeCreator(campaignId, selected.creatorKey)
      setSelected(null)
      await load(1, false)
    } catch (cause) {
      setError(cause)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="tcw-split">
      <div className="tcw-split-main">
        <div className="tcw-toolbar">
          <input
            className="tcw-input search"
            placeholder="搜索达人名或 handle"
            value={keyword}
            onChange={event => setKeyword(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') setQuery(keyword.trim()) }}
          />
          <button className="tcw-btn" onClick={() => setQuery(keyword.trim())}>搜索</button>
          <span className="tcw-spacer" />
          <span className="tcw-small tcw-muted">{rows.length} / {total}</span>
          <button className="tcw-btn" onClick={onImport}>导入飞书达人</button>
        </div>
        {error ? <div className="tcw-error">{error.message}</div> : null}
        <div className="tcw-card flush">
          <table className="tcw-table">
            <thead>
              <tr>
                <th className="col-name">达人</th>
                <th>平台</th>
                <th>国家</th>
                <th className="num">粉丝</th>
                <th className="num">互动率</th>
                <th>层级</th>
                <th>建联</th>
                <th className="col-time">数据更新</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.creatorKey}
                  className={`clickable ${selected?.creatorKey === row.creatorKey ? 'on' : ''}`}
                  onClick={() => setSelected(row)}
                >
                  <td>
                    <div className="tcw-name">
                      <Avatar name={row.displayName ?? row.creatorKey} src={row.avatarUrl} size={30} />
                      <div className="tcw-name-body">
                        <b>{row.displayName ?? row.creatorKey}</b>
                        <span>{row.handle ? `@${row.handle}` : row.creatorKey}</span>
                      </div>
                    </div>
                  </td>
                  <td className="tcw-muted">{platformName(String(row.platform ?? '').toLowerCase())}</td>
                  <td className="tcw-muted">{row.country ? countryName(row.country) : '—'}</td>
                  <td className="num">{compact(row.followerCount)}</td>
                  <td className="num">{percent(row.engagementRate)}</td>
                  <td>{row.joinTier ? <Tag>{TIER[row.joinTier] ?? row.joinTier}</Tag> : <span className="tcw-muted">—</span>}</td>
                  <td>
                    {row.outreachStage
                      ? <Tag tone={row.outreachStage === 'not_contacted' ? '' : 'alt'}>{OUTREACH[row.outreachStage] ?? row.outreachStage}</Tag>
                      : <span className="tcw-muted">—</span>}
                  </td>
                  <td className="tcw-muted col-time">{when(row.dataUpdatedAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading ? <tr><td colSpan={8}><div className="tcw-empty">这个活动还没有达人。</div></td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="tcw-list-foot">
          <span className="tcw-small tcw-muted">已显示 {rows.length} / {total}</span>
          <span className="tcw-spacer" />
          {rows.length < total
            ? <button className="tcw-btn" onClick={() => void load(page + 1, true)} disabled={loading}>{loading ? '加载中…' : '加载更多'}</button>
            : null}
        </div>
      </div>

      {selected ? (
        <aside className="tcw-drawer">
          <header>
            <Avatar name={selected.displayName ?? selected.creatorKey} src={selected.avatarUrl} size={40} />
            <div>
              <b>{selected.displayName ?? selected.creatorKey}</b>
              <span className="tcw-small tcw-muted">{selected.creatorKey}</span>
            </div>
            <button className="tcw-x" onClick={() => setSelected(null)} aria-label="关闭">×</button>
          </header>
          <dl>
            <dt>平台</dt><dd>{platformName(String(selected.platform ?? '').toLowerCase())}</dd>
            <dt>国家</dt><dd>{selected.country ? countryName(selected.country) : '—'}</dd>
            <dt>粉丝</dt><dd>{compact(selected.followerCount)}</dd>
            <dt>互动率</dt><dd>{percent(selected.engagementRate)}</dd>
            <dt>层级</dt><dd>{TIER[selected.joinTier] ?? selected.joinTier ?? '—'}</dd>
            <dt>建联阶段</dt><dd>{OUTREACH[selected.outreachStage] ?? selected.outreachStage ?? '—'}</dd>
            <dt>验证</dt><dd>{selected.verifyStatus ?? '—'}</dd>
            <dt>数据更新</dt><dd>{when(selected.dataUpdatedAt)}</dd>
            {selected.profileUrl ? <Fragment><dt>主页</dt><dd><a href={selected.profileUrl} target="_blank" rel="noreferrer">打开原页面</a></dd></Fragment> : null}
          </dl>
          {selected.recommendReason ? <p className="tcw-reason">{selected.recommendReason}</p> : null}
          <footer>
            <button className="tcw-btn danger" onClick={() => void remove()} disabled={removing}>{removing ? '移除中…' : '从活动移除'}</button>
          </footer>
        </aside>
      ) : null}
    </div>
  )
}

/** Overview tab: the campaign's own fields and artifacts. */
function OverviewTab({ campaign }) {
  const fields = [
    ['营销目标', campaign?.goal],
    ['产品', campaign?.product],
    ['目标受众', campaign?.targetAudience],
    ['卖点', campaign?.sellingPoints],
    ['达人偏好', campaign?.creatorPreference],
    ['竞品', campaign?.competitors],
    ['周期', campaign?.timeline],
    ['简介', campaign?.intro],
    ['备注', campaign?.remark],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '')
  const artifacts = campaign?.artifacts ?? []
  return (
    <div className="tcw-grid-detail">
      <section className="tcw-card pad">
        <h3>活动信息</h3>
        {fields.length === 0 ? <div className="tcw-empty">没有更多描述字段。</div> : (
          <dl className="tcw-fields">
            {fields.map(([label, value]) => (
              <Fragment key={label}>
                <dt>{label}</dt>
                <dd>{String(value)}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </section>
      <section className="tcw-card pad">
        <h3>标识与产出</h3>
        <dl className="tcw-fields">
          <dt>活动 id</dt><dd className="tcw-mono">{campaign?.id ?? '—'}</dd>
          <dt>我的角色</dt><dd>{campaign?.myRole ?? '—'}</dd>
          <dt>成员</dt><dd>{campaign?.memberCount ?? 0}</dd>
          <dt>文件</dt><dd>{campaign?.fileCount ?? 0}</dd>
          <dt>创建</dt><dd>{when(campaign?.createdAt)}</dd>
          <dt>更新</dt><dd>{when(campaign?.updatedAt)}</dd>
          {campaign?.archivedAt ? <Fragment><dt>归档</dt><dd>{when(campaign.archivedAt)}</dd></Fragment> : null}
        </dl>
        <h3 className="tcw-mt">产出文件</h3>
        {artifacts.length === 0 ? <div className="tcw-empty">还没有产出。</div> : (
          <ul className="tcw-artifacts">
            {artifacts.map(artifact => (
              <li key={`${artifact.type}-${artifact.createdAt}`}>
                {artifact.url
                  ? <a href={artifact.url} target="_blank" rel="noreferrer">{artifact.title ?? artifact.type}</a>
                  : <span>{artifact.title ?? artifact.type}</span>}
                <span className="tcw-small tcw-muted">{artifact.type} · {when(artifact.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/** Outreach tab inside one campaign. */
function CampaignOutreachTab({ campaignId, signedIn, onOpenInbox }) {
  const [threads, setThreads] = useState(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!signedIn) return
    let live = true
    Promise.all([fetchThreads('inbox', { campaignId, page: 1 }), fetchPendingOutreach({ page: 1, pageSize: 100 })])
      .then(([threadsPayload, pendingPayload]) => {
        if (!live) return
        setThreads(threadsPayload)
        setPending(pendingPayload)
      })
      .catch(cause => { if (live) setError(cause) })
    return () => { live = false }
  }, [campaignId, signedIn])

  const rows = itemsOf(threads)
  const pendingRow = itemsOf(pending).find(row => String(row.id) === String(campaignId))

  return (
    <div className="tcw-grid-detail">
      <section className="tcw-card pad">
        <h3>待触达</h3>
        <div className="tcw-metric-line">
          <span className="tcw-metric-value">{pendingRow?.pendingCount ?? 0}</span>
          <span className="tcw-small tcw-muted">位达人等待第一条建联邮件</span>
        </div>
        {pendingRow?.timeline ? <p className="tcw-small tcw-muted">周期：{pendingRow.timeline.start} → {pendingRow.timeline.end}</p> : null}
        <button className="tcw-btn" onClick={onOpenInbox}>打开触达收件箱</button>
      </section>
      <section className="tcw-card pad">
        <h3>这个活动的线程</h3>
        {error ? <div className="tcw-error">{error.message}</div> : null}
        {rows.length === 0 ? <div className="tcw-empty">还没有线程。发起触达后会出现在这里和收件箱。</div> : (
          <ul className="tcw-threadlist">
            {rows.map(thread => (
              <li key={thread.id ?? thread.threadId}>
                <b>{thread.creatorName ?? thread.subject ?? '线程'}</b>
                <span className="tcw-small tcw-muted">{thread.status ?? ''} · {when(thread.lastMessageAt ?? thread.updatedAt)}</span>
                <p>{thread.snippet ?? ''}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/** One campaign's workspace. */
function CampaignDetail({ campaignId, onBack, onNotice, onOpenInbox, version }) {
  const [campaign, setCampaign] = useState(null)
  const [cards, setCards] = useState(null)
  const [pending, setPending] = useState(null)
  const [tab, setTab] = useState('cards')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [rosterVersion, setRosterVersion] = useState(0)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let live = true
    setError(null)
    Promise.all([fetchCampaign(campaignId), fetchRoleCards(campaignId), fetchPendingOutreach({ page: 1, pageSize: 100 })])
      .then(([detail, roleCards, pendingPayload]) => {
        if (!live) return
        setCampaign(detail)
        setCards(roleCards)
        setPending(pendingPayload)
      })
      .catch(cause => { if (live) setError(cause) })
    return () => { live = false }
  }, [campaignId, version, refresh])

  const roleCards = useMemo(() => itemsOf(cards), [cards])
  const pendingRow = useMemo(
    () => itemsOf(pending).find(row => String(row.id) === String(campaignId)),
    [pending, campaignId],
  )

  const changeStatus = async event => {
    const next = event.target.value
    if (next === campaign?.status) return
    setBusy(true)
    setError(null)
    try {
      const updated = await updateCampaign(campaignId, { status: next })
      setCampaign(previous => ({ ...previous, ...updated, status: next }))
      onNotice(`状态已改为「${STATUS[next]?.[0] ?? next}」`)
    } catch (cause) {
      setError(cause)
    } finally {
      setBusy(false)
    }
  }

  const startTask = async card => {
    setBusy(true)
    setError(null)
    try {
      await startSearchTask(campaignId, card.id)
      onNotice('推荐任务已发起（异步）；完成后点「查看报告」。')
      setRefresh(value => value + 1)
    } catch (cause) {
      setError(cause)
    } finally {
      setBusy(false)
    }
  }

  const tierStats = campaign?.creatorTierStats
  const creatorTotal = campaign?.creatorCount
    ?? ((tierStats?.head ?? 0) + (tierStats?.mid ?? 0) + (tierStats?.tail ?? 0))
  const metrics = [
    ['达人', creatorTotal],
    ['招募目标', campaign?.recruitTarget?.total ?? '—'],
    ['头 / 腰 / 尾', `${campaign?.creatorTierStats?.head ?? 0} / ${campaign?.creatorTierStats?.mid ?? 0} / ${campaign?.creatorTierStats?.tail ?? 0}`],
    ['角色卡', roleCards.length],
    ['待触达', pendingRow?.pendingCount ?? 0],
    ['成员', campaign?.memberCount ?? 0],
  ]

  return (
    <div className="tcw-inner">
      <div className="tcw-detail-head">
        <button className="tcw-btn sm" onClick={onBack}>← 活动</button>
        <Avatar name={campaign?.brand ?? campaign?.name} size={38} />
        <div className="tcw-detail-title">
          <h1>{campaign?.name ?? '活动'}</h1>
          <div className="tcw-sub">
            <span>{campaign?.brand ?? '—'}</span>
            {campaign?.category ? <Fragment><span>·</span><span>{campaign.category}</span></Fragment> : null}
            {campaign?.goal ? <Fragment><span>·</span><span>{campaign.goal}</span></Fragment> : null}
            <span>·</span>
            <span>更新于 {when(campaign?.updatedAt)}</span>
          </div>
        </div>
        <div className="tcw-actions">
          <select className="tcw-select" value={campaign?.status ?? ''} onChange={changeStatus} disabled={busy} aria-label="修改阶段">
            {['draft', 'strategy', 'outreach', 'completed'].map(key => (
              <option key={key} value={key}>{STATUS[key][0]}</option>
            ))}
          </select>
          <button className="tcw-btn" onClick={() => setRefresh(value => value + 1)} disabled={busy}>刷新</button>
          <button className="tcw-btn" onClick={() => setDialog('card')} disabled={busy}>新建角色卡</button>
          <button className="tcw-btn primary" onClick={() => setDialog('import')} disabled={busy}>导入飞书达人</button>
        </div>
      </div>

      <div className="tcw-meta">
        {(campaign?.market ?? []).map(code => <Tag key={code}>{countryName(code)}</Tag>)}
        {(campaign?.platformFocus ?? []).map(code => <Tag key={code} tone="alt">{platformName(code)}</Tag>)}
        <Tag>预算 {money(campaign?.budget)}</Tag>
        {campaign?.timeline ? <Tag>周期 {campaign.timeline}</Tag> : null}
        <Tag>{campaign?.myRole ?? '成员'}</Tag>
      </div>

      <div className="tcw-metrics">
        {metrics.map(([label, value]) => (
          <div className="tcw-metric" key={label}>
            <span className="tcw-metric-value">{value}</span>
            <span className="tcw-small tcw-muted">{label}</span>
          </div>
        ))}
      </div>

      <div className="tcw-tabs-line">
        <button className={tab === 'cards' ? 'on' : ''} onClick={() => setTab('cards')}>角色卡（{roleCards.length}）</button>
        <button className={tab === 'roster' ? 'on' : ''} onClick={() => { setTab('roster'); setRosterVersion(value => value + 1) }}>
          达人清单（{creatorTotal}）
        </button>
        <button className={tab === 'about' ? 'on' : ''} onClick={() => setTab('about')}>概览</button>
        <button className={tab === 'outreach' ? 'on' : ''} onClick={() => setTab('outreach')}>
          触达{pendingRow?.pendingCount ? `（${pendingRow.pendingCount}）` : ''}
        </button>
      </div>

      {error ? <div className="tcw-error">{error.message}</div> : null}

      {tab === 'cards' ? (
        <div className="tcw-cards">
          {roleCards.map(card => (
            <RoleCard
              key={card.id}
              card={card}
              busy={busy}
              onStart={value => void startTask(value)}
              onReport={value => setDialog({ kind: 'report', card: value })}
            />
          ))}
          {roleCards.length === 0 ? (
            <div className="tcw-empty big">
              <p>还没有角色卡。</p>
              <p className="tcw-small">角色卡描述要找什么样的人；建卡后可以一键发起推荐。</p>
              <button className="tcw-btn primary" onClick={() => setDialog('card')}>新建角色卡</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'roster' ? (
        <RosterTab campaignId={campaignId} signedIn onImport={() => setDialog('import')} version={rosterVersion + refresh} />
      ) : null}
      {tab === 'about' ? <OverviewTab campaign={campaign} /> : null}
      {tab === 'outreach' ? <CampaignOutreachTab campaignId={campaignId} signedIn onOpenInbox={onOpenInbox} /> : null}

      {dialog === 'card' ? (
        <CreateCardDialog
          campaignId={campaignId}
          onClose={() => setDialog(null)}
          onCreated={() => {
            setDialog(null)
            onNotice('角色卡已创建。')
            setRefresh(value => value + 1)
            setTab('cards')
          }}
        />
      ) : null}
      {dialog === 'import' ? (
        <ImportDialog
          campaignId={campaignId}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            onNotice('导入任务已提交（异步）。')
            setRosterVersion(value => value + 1)
          }}
        />
      ) : null}
      {dialog?.kind === 'report' ? <ReportDialog campaignId={campaignId} card={dialog.card} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

/** Outreach inbox: threads and pending campaigns on the left, reply composer on the right. */
function Outreach({ signedIn, configured, onOpenCampaign, version }) {
  const [box, setBox] = useState('inbox')
  const [threads, setThreads] = useState(null)
  const [pending, setPending] = useState(null)
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!signedIn) return
    let live = true
    setError(null)
    Promise.all([fetchThreads(box, { page: 1 }), fetchPendingOutreach({ page: 1, pageSize: 100 })])
      .then(([threadsPayload, pendingPayload]) => {
        if (!live) return
        setThreads(threadsPayload)
        setPending(pendingPayload)
      })
      .catch(cause => { if (live) setError(cause) })
    return () => { live = false }
  }, [box, signedIn, version])

  const rows = useMemo(() => itemsOf(threads), [threads])
  const pendingRows = useMemo(() => itemsOf(pending), [pending])

  if (!signedIn) return <SignedOut configured={configured} />

  const send = async () => {
    if (!selected || text.trim() === '') return
    setSending(true)
    setError(null)
    setNotice(null)
    try {
      await replyToThread(selected.id ?? selected.threadId, text)
      setNotice('回复已提交。')
      setText('')
    } catch (cause) {
      setError(cause)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="tcw-outreach">
      <section className="tcw-threads">
        <div className="head">
          <button className={`tcw-chip ${box === 'inbox' ? 'on' : ''}`} onClick={() => setBox('inbox')}>收件箱</button>
          <button className={`tcw-chip ${box === 'archived' ? 'on' : ''}`} onClick={() => setBox('archived')}>归档</button>
        </div>
        <div className="list">
          {rows.map(thread => (
            <div
              key={thread.id ?? thread.threadId}
              className={`tcw-thread ${selected && (selected.id ?? selected.threadId) === (thread.id ?? thread.threadId) ? 'on' : ''}`}
              onClick={() => { setSelected(thread); setNotice(null) }}
            >
              <div className="r1">
                <b>{thread.creatorName ?? thread.subject ?? '线程'}</b>
                <span>{when(thread.lastMessageAt ?? thread.updatedAt)}</span>
              </div>
              <div className="r2">{thread.subject ?? thread.snippet ?? '—'}</div>
            </div>
          ))}
          {rows.length === 0 ? <div className="tcw-empty">当前箱子没有线程。</div> : null}
        </div>
        <div className="head tcw-pending-head">待触达活动</div>
        <div className="list">
          {pendingRows.map(row => (
            <div key={row.id} className="tcw-thread" onClick={() => onOpenCampaign(row.id)}>
              <div className="r1">
                <b>{row.name}</b>
                <span className="tcw-pill info">{row.pendingCount}</span>
              </div>
              <div className="r2">{row.timeline ? `${row.timeline.start} → ${row.timeline.end}` : '未设周期'}</div>
            </div>
          ))}
          {pendingRows.length === 0 ? <div className="tcw-empty">没有待触达的达人。</div> : null}
        </div>
      </section>

      <section className="tcw-thread-detail">
        <div className="tcw-thread-head">
          <b>{selected?.creatorName ?? selected?.subject ?? '选择一个线程'}</b>
          {selected ? <span className="tcw-pill">{selected.status ?? '—'}</span> : null}
        </div>
        <div className="tcw-thread-body">
          {error ? <div className="tcw-error">{error.message}</div> : null}
          {notice ? <div className="tcw-notice">{notice}</div> : null}
          {!selected ? <div className="tcw-empty">从左侧选一个线程，查看摘要并回复。</div> : (
            <dl className="tcw-fields">
              <dt>线程 id</dt><dd className="tcw-mono">{selected.id ?? selected.threadId}</dd>
              <dt>主题</dt><dd>{selected.subject ?? '—'}</dd>
              <dt>最近一封</dt><dd>{selected.snippet ?? '—'}</dd>
              <dt>更新时间</dt><dd>{when(selected.lastMessageAt ?? selected.updatedAt)}</dd>
            </dl>
          )}
        </div>
        <div className="tcw-composer">
          <textarea
            placeholder="用纯文本写回复；空行分段，服务会转成 HTML。"
            value={text}
            onChange={event => setText(event.target.value)}
            disabled={!selected || sending}
          />
          <div className="tcw-row">
            <span className="tcw-small tcw-muted">以你的账号身份提交到 outreach_service。</span>
            <span className="tcw-spacer" />
            <button className="tcw-btn primary" onClick={() => void send()} disabled={!selected || sending || text.trim() === ''}>
              {sending ? '发送中…' : '发送回复'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

/** Panel root. */
export function App() {
  const [view, setView] = useState('campaigns')
  const [campaignId, setCampaignId] = useState(null)
  const [status, setStatus] = useState({ signedIn: false, configured: false })
  const [notice, setNotice] = useState(null)
  const [dialog, setDialog] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let live = true
    const refresh = () => {
      fetchStatus()
        .then(next => { if (live) setStatus(next) })
        .catch(() => { if (live) setStatus({ signedIn: false, configured: false }) })
    }
    refresh()
    // Signing in happens in Settings, which the user returns from; the panel is a
    // global view that stays mounted, so follow focus instead of waiting for a remount.
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      live = false
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const openCampaign = useCallback(id => { setCampaignId(String(id)); setView('detail') }, [])

  return (
    <div className="tcw">
      <div className="tcw-top">
        <div className="tcw-title">活动工作台</div>
        <nav className="tcw-tabs" aria-label="活动工作台分区">
          <button className={view !== 'outreach' ? 'on' : ''} onClick={() => { setView('campaigns'); setCampaignId(null) }}>活动</button>
          <button className={view === 'outreach' ? 'on' : ''} onClick={() => { setView('outreach'); setCampaignId(null) }}>触达</button>
        </nav>
        <div className="tcw-actions">
          {notice ? <span className="tcw-notice inline">{notice}</span> : null}
          <span className={`tcw-pill ${status.signedIn ? 'ok' : 'warn'}`}>{status.signedIn ? '飞书已登录' : '未登录'}</span>
          <button className="tcw-btn sm" onClick={() => setVersion(value => value + 1)}>全局刷新</button>
        </div>
      </div>

      <div className="tcw-body">
        {view === 'outreach' ? (
          <Outreach
            signedIn={status.signedIn}
            configured={status.configured}
            onOpenCampaign={openCampaign}
            version={version}
          />
        ) : null}
        {view === 'campaigns' ? (
          <CampaignList
            signedIn={status.signedIn}
            configured={status.configured}
            onOpen={openCampaign}
            onCreate={() => setDialog(true)}
            version={version}
          />
        ) : null}
        {view === 'detail' && campaignId !== null ? (
          <CampaignDetail
            campaignId={campaignId}
            version={version}
            onBack={() => { setCampaignId(null); setView('campaigns') }}
            onNotice={setNotice}
            onOpenInbox={() => { setView('outreach'); setCampaignId(null) }}
          />
        ) : null}
      </div>

      {dialog ? (
        <CreateCampaignDialog
          onClose={() => setDialog(false)}
          onCreated={created => {
            setDialog(false)
            setNotice(`活动已创建：${created?.name ?? ''}`)
            setVersion(value => value + 1)
            if (created?.id) openCampaign(created.id)
          }}
        />
      ) : null}
    </div>
  )
}