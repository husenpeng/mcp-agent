/** Copy for the remote-access settings page, one dictionary per shipped locale. */

/** Chinese copy. */
export const zh = {
  nav: '手机',
  title: '远程访问',
  description: '从手机上的 Tomato Remote 连到这台电脑。隧道由桌面应用托管，关闭应用即停止。',
  desktopOnly: '只有桌面应用可以托管手机连接；当前页面运行在浏览器里。',
  status: '隧道状态',
  'phase.off': '未开启',
  'phase.starting': '正在连接…',
  'phase.online': '已连接',
  'phase.failed': '连接失败',
  pairingLink: '配对链接',
  copy: '复制',
  copied: '已复制',
  qrAlt: '配对链接二维码',
  qrHint: '用手机扫描二维码，或把链接粘贴到 Tomato Remote 的配对输入框。',
  start: '开启隧道',
  stop: '关闭隧道',
  failed: '操作失败，请重试。',
  autoStart: '下次启动自动开启：在桌面应用的 settings.json 里把 remote.tunnel 设为 true。',
}

/** English copy. */
export const en: Record<keyof typeof zh, string> = {
  nav: 'Phone',
  title: 'Remote access',
  description: 'Connect Tomato Remote on your phone to this Mac. The Desktop app supervises the tunnel; quitting it stops the link.',
  desktopOnly: 'Only the Desktop app can host a phone connection; this page is running in a browser.',
  status: 'Tunnel',
  'phase.off': 'Off',
  'phase.starting': 'Connecting…',
  'phase.online': 'Online',
  'phase.failed': 'Failed',
  pairingLink: 'Pairing link',
  copy: 'Copy',
  copied: 'Copied',
  qrAlt: 'Pairing link QR code',
  qrHint: 'Scan the code with your phone, or paste the link into Tomato Remote.',
  start: 'Start tunnel',
  stop: 'Stop tunnel',
  failed: 'That did not work. Try again.',
  autoStart: 'To start with the app, set remote.tunnel to true in the Desktop settings.json.',
}

/** Japanese copy. */
export const ja: Record<keyof typeof zh, string> = {
  nav: 'スマートフォン',
  title: 'リモートアクセス',
  description: 'スマートフォンの Tomato Remote からこの Mac に接続します。トンネルはデスクトップアプリが管理し、終了すると切断されます。',
  desktopOnly: 'スマートフォン接続を提供できるのはデスクトップアプリだけです。このページはブラウザで動作しています。',
  status: 'トンネル状態',
  'phase.off': '停止中',
  'phase.starting': '接続中…',
  'phase.online': '接続済み',
  'phase.failed': '失敗',
  pairingLink: 'ペアリングリンク',
  copy: 'コピー',
  copied: 'コピーしました',
  qrAlt: 'ペアリングリンクの QR コード',
  qrHint: 'QR コードを読み取るか、リンクを Tomato Remote に貼り付けてください。',
  start: 'トンネルを開始',
  stop: 'トンネルを停止',
  failed: '操作に失敗しました。もう一度お試しください。',
  autoStart: '起動時に自動で開始するには、デスクトップ設定の settings.json で remote.tunnel を true にします。',
}

/** Spanish copy. */
export const es: Record<keyof typeof zh, string> = {
  nav: 'Teléfono',
  title: 'Acceso remoto',
  description: 'Conecta Tomato Remote del teléfono a este Mac. La app de escritorio gestiona el túnel; al cerrarla se corta el enlace.',
  desktopOnly: 'Solo la app de escritorio puede alojar la conexión del teléfono; esta página se ejecuta en el navegador.',
  status: 'Túnel',
  'phase.off': 'Apagado',
  'phase.starting': 'Conectando…',
  'phase.online': 'En línea',
  'phase.failed': 'Error',
  pairingLink: 'Enlace de emparejamiento',
  copy: 'Copiar',
  copied: 'Copiado',
  qrAlt: 'Código QR del enlace de emparejamiento',
  qrHint: 'Escanea el código o pega el enlace en Tomato Remote.',
  start: 'Iniciar túnel',
  stop: 'Detener túnel',
  failed: 'No funcionó. Inténtalo de nuevo.',
  autoStart: 'Para iniciarlo con la app, pon remote.tunnel en true en settings.json del escritorio.',
}

/** French copy. */
export const fr: Record<keyof typeof zh, string> = {
  nav: 'Téléphone',
  title: 'Accès distant',
  description: 'Connectez Tomato Remote à ce Mac. L\'application de bureau gère le tunnel ; la fermer coupe le lien.',
  desktopOnly: 'Seule l\'application de bureau peut héberger la connexion du téléphone ; cette page s\'exécute dans un navigateur.',
  status: 'Tunnel',
  'phase.off': 'Arrêté',
  'phase.starting': 'Connexion…',
  'phase.online': 'En ligne',
  'phase.failed': 'Échec',
  pairingLink: "Lien d'appairage",
  copy: 'Copier',
  copied: 'Copié',
  qrAlt: 'Code QR du lien d\'appairage',
  qrHint: 'Scannez le code ou collez le lien dans Tomato Remote.',
  start: 'Démarrer le tunnel',
  stop: 'Arrêter le tunnel',
  failed: 'L\'opération a échoué. Réessayez.',
  autoStart: 'Pour démarrer avec l\'application, mettez remote.tunnel à true dans le settings.json du bureau.',
}

/** German copy. */
export const de: Record<keyof typeof zh, string> = {
  nav: 'Telefon',
  title: 'Fernzugriff',
  description: 'Verbinde Tomato Remote auf dem Telefon mit diesem Mac. Die Desktop-App betreut den Tunnel; beim Beenden endet die Verbindung.',
  desktopOnly: 'Nur die Desktop-App kann die Telefonverbindung bereitstellen; diese Seite läuft im Browser.',
  status: 'Tunnel',
  'phase.off': 'Aus',
  'phase.starting': 'Verbinden…',
  'phase.online': 'Verbunden',
  'phase.failed': 'Fehlgeschlagen',
  pairingLink: 'Kopplungslink',
  copy: 'Kopieren',
  copied: 'Kopiert',
  qrAlt: 'QR-Code des Kopplungslinks',
  qrHint: 'Scanne den Code oder füge den Link in Tomato Remote ein.',
  start: 'Tunnel starten',
  stop: 'Tunnel stoppen',
  failed: 'Das hat nicht funktioniert. Bitte erneut versuchen.',
  autoStart: 'Zum Start mit der App remote.tunnel in der settings.json des Desktops auf true setzen.',
}

/** Russian copy. */
export const ru: Record<keyof typeof zh, string> = {
  nav: 'Телефон',
  title: 'Удалённый доступ',
  description: 'Подключите Tomato Remote на телефоне к этому Mac. Туннелем управляет настольное приложение; при выходе связь обрывается.',
  desktopOnly: 'Подключение телефона может обеспечивать только настольное приложение; эта страница открыта в браузере.',
  status: 'Туннель',
  'phase.off': 'Выключен',
  'phase.starting': 'Подключение…',
  'phase.online': 'Подключено',
  'phase.failed': 'Ошибка',
  pairingLink: 'Ссылка для сопряжения',
  copy: 'Копировать',
  copied: 'Скопировано',
  qrAlt: 'QR-код ссылки для сопряжения',
  qrHint: 'Отсканируйте код или вставьте ссылку в Tomato Remote.',
  start: 'Запустить туннель',
  stop: 'Остановить туннель',
  failed: 'Не получилось. Повторите попытку.',
  autoStart: 'Чтобы запускать вместе с приложением, установите remote.tunnel в true в settings.json рабочего стола.',
}

/** Portuguese copy. */
export const pt: Record<keyof typeof zh, string> = {
  nav: 'Telefone',
  title: 'Acesso remoto',
  description: 'Conecte o Tomato Remote do telefone a este Mac. O app de desktop gerencia o túnel; ao fechá-lo, o link cai.',
  desktopOnly: 'Apenas o app de desktop pode hospedar a conexão do telefone; esta página está no navegador.',
  status: 'Túnel',
  'phase.off': 'Desligado',
  'phase.starting': 'Conectando…',
  'phase.online': 'Conectado',
  'phase.failed': 'Falhou',
  pairingLink: 'Link de pareamento',
  copy: 'Copiar',
  copied: 'Copiado',
  qrAlt: 'QR code do link de pareamento',
  qrHint: 'Escaneie o código ou cole o link no Tomato Remote.',
  start: 'Iniciar túnel',
  stop: 'Parar túnel',
  failed: 'Não funcionou. Tente de novo.',
  autoStart: 'Para iniciar com o app, defina remote.tunnel como true no settings.json do desktop.',
}

/** Copy keys this page renders. */
export type RemoteSettingsLocaleKey = keyof typeof zh
