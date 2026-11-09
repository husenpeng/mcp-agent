/** Access-section copy; English is the key-set source of truth. */
export const en = {
  nav: 'Access',
  title: 'Access',
  description: 'Roles and quotas verified by the company auth service for your Feishu account.',
  loading: 'Reading access…',
  signedOut: 'Sign in to see your roles and quotas.',
  unavailable: 'Access data is unavailable. Try again later.',
  roles: 'Roles',
  none: 'None',
  quotas: 'Quotas',
}
export type AccessKey = keyof typeof en
export const zh: Record<AccessKey, string> = {
  nav: '权限', title: '权限', description: '公司 auth_service 为你的飞书账号验证的角色与额度。',
  loading: '正在读取权限…', signedOut: '登录后查看角色与额度。', unavailable: '权限数据暂不可用，请稍后重试。',
  roles: '角色', none: '无', quotas: '额度',
}
export const ja: Record<AccessKey, string> = { ...en, nav: 'アクセス', title: 'アクセス', description: '会社の auth_service が確認したロールとクォータです。', loading: '読み込み中…', signedOut: 'ログインするとロールとクォータを表示します。', unavailable: 'アクセス情報を取得できません。', roles: 'ロール', none: 'なし', quotas: 'クォータ' }
export const es: Record<AccessKey, string> = { ...en, nav: 'Acceso', title: 'Acceso', description: 'Roles y cuotas verificados por auth_service para tu cuenta de Feishu.', loading: 'Leyendo acceso…', signedOut: 'Inicia sesión para ver roles y cuotas.', unavailable: 'Los datos de acceso no están disponibles.', roles: 'Roles', none: 'Ninguno', quotas: 'Cuotas' }
export const fr: Record<AccessKey, string> = { ...en, nav: 'Accès', title: 'Accès', description: 'Rôles et quotas vérifiés par auth_service pour votre compte Feishu.', loading: 'Lecture des accès…', signedOut: 'Connectez-vous pour voir vos rôles et quotas.', unavailable: 'Les données d’accès sont indisponibles.', roles: 'Rôles', none: 'Aucun', quotas: 'Quotas' }
export const de: Record<AccessKey, string> = { ...en, nav: 'Zugriff', title: 'Zugriff', description: 'Von auth_service bestätigte Rollen und Kontingente für Ihr Feishu-Konto.', loading: 'Zugriff wird gelesen…', signedOut: 'Melden Sie sich an, um Rollen und Kontingente zu sehen.', unavailable: 'Zugriffsdaten sind nicht verfügbar.', roles: 'Rollen', none: 'Keine', quotas: 'Kontingente' }
export const ru: Record<AccessKey, string> = { ...en, nav: 'Доступ', title: 'Доступ', description: 'Роли и квоты, подтверждённые auth_service для вашей учётной записи Feishu.', loading: 'Чтение доступа…', signedOut: 'Войдите, чтобы увидеть роли и квоты.', unavailable: 'Данные доступа недоступны.', roles: 'Роли', none: 'Нет', quotas: 'Квоты' }
export const pt: Record<AccessKey, string> = { ...en, nav: 'Acesso', title: 'Acesso', description: 'Funções e cotas verificadas pelo auth_service para sua conta Feishu.', loading: 'Lendo acesso…', signedOut: 'Entre para ver funções e cotas.', unavailable: 'Dados de acesso indisponíveis.', roles: 'Funções', none: 'Nenhuma', quotas: 'Cotas' }
