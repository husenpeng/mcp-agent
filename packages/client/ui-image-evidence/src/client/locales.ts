/** `imageEvidence` namespace dictionaries. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'meta.read': '由 {engine} 读取 · {duration}',
  'meta.reused': '由 {engine} 读取 · 复用',
  'meta.failed': '这张图读取失败',
  'details.engine': '引擎',
  'details.attempts': '尝试次数',
  'details.time': '耗时',
  'note.cached': '复用此前保存的证据，本次未调用引擎。',
  'note.truncated': '证据已截断，模型看到的是不完整的内容。',
  'note.failed': '模型收到的是占位文本，没有读到图像内容。',
  'action.expand': '展开证据详情',
  'action.collapse': '收起证据详情',
  'duration.seconds': '{seconds}秒',
} satisfies Record<string, string>

/** The imageEvidence namespace key union. */
export type ImageEvidenceKey = keyof typeof zh

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Copy of the evidence status beside a pasted image. */
    imageEvidence: ImageEvidenceKey
  }
}

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'meta.read': 'Read by {engine} · {duration}',
  'meta.reused': 'Read by {engine} · reused',
  'meta.failed': 'Could not read this image',
  'details.engine': 'Engine',
  'details.attempts': 'Attempts',
  'details.time': 'Time',
  'note.cached': 'Reused evidence stored by an earlier read; no engine call was made.',
  'note.truncated': 'The evidence was truncated, so the model received an incomplete reading.',
  'note.failed': 'The model received the text-only placeholder instead of the image.',
  'action.expand': 'Show evidence details',
  'action.collapse': 'Hide evidence details',
  'duration.seconds': '{seconds}s',
} satisfies Record<ImageEvidenceKey, string>

/** Japanese copy, checked against the English keys. */
export const ja = {
  'meta.read': '{engine} が読み取り · {duration}',
  'meta.reused': '{engine} が読み取り · 再利用',
  'meta.failed': 'この画像を読み取れませんでした',
  'details.engine': 'エンジン',
  'details.attempts': '試行回数',
  'details.time': '所要時間',
  'note.cached': '以前の読み取りで保存した証拠を再利用しました。エンジンは呼び出していません。',
  'note.truncated': '証拠は切り詰められたため、モデルは不完全な内容を受け取りました。',
  'note.failed': 'モデルは画像ではなくテキストのみのプレースホルダーを受け取りました。',
  'action.expand': '証拠の詳細を表示',
  'action.collapse': '証拠の詳細を隠す',
  'duration.seconds': '{seconds}秒',
} satisfies Record<keyof typeof en, string>

/** Spanish dictionary, checked against the English keys. */
export const es = {
  'meta.read': 'Leído por {engine} · {duration}',
  'meta.reused': 'Leído por {engine} · reutilizado',
  'meta.failed': 'No se pudo leer esta imagen',
  'details.engine': 'Motor',
  'details.attempts': 'Intentos',
  'details.time': 'Tiempo',
  'note.cached': 'Se reutilizaron datos guardados por una lectura anterior; no se llamó al motor.',
  'note.truncated': 'Los datos se truncaron, así que el modelo recibió una lectura incompleta.',
  'note.failed': 'El modelo recibió el marcador de texto en lugar de la imagen.',
  'action.expand': 'Mostrar detalles de la evidencia',
  'action.collapse': 'Ocultar detalles de la evidencia',
  'duration.seconds': '{seconds}s',
} satisfies Record<keyof typeof en, string>

/** French dictionary, checked against the English keys. */
export const fr = {
  'meta.read': 'Lu par {engine} · {duration}',
  'meta.reused': 'Lu par {engine} · réutilisé',
  'meta.failed': 'Impossible de lire cette image',
  'details.engine': 'Moteur',
  'details.attempts': 'Tentatives',
  'details.time': 'Durée',
  'note.cached': 'Preuves enregistrées lors d’une lecture antérieure réutilisées ; aucun appel au moteur.',
  'note.truncated': 'Les preuves ont été tronquées ; le modèle a reçu une lecture incomplète.',
  'note.failed': 'Le modèle a reçu le texte de remplacement au lieu de l’image.',
  'action.expand': 'Afficher les détails des preuves',
  'action.collapse': 'Masquer les détails des preuves',
  'duration.seconds': '{seconds}s',
} satisfies Record<keyof typeof en, string>

/** German dictionary, checked against the English keys. */
export const de = {
  'meta.read': 'Gelesen von {engine} · {duration}',
  'meta.reused': 'Gelesen von {engine} · wiederverwendet',
  'meta.failed': 'Dieses Bild konnte nicht gelesen werden',
  'details.engine': 'Engine',
  'details.attempts': 'Versuche',
  'details.time': 'Dauer',
  'note.cached': 'Belege aus einem früheren Lesevorgang werden wiederverwendet; es wurde kein Engine-Aufruf ausgeführt.',
  'note.truncated': 'Die Belege wurden gekürzt, daher erhielt das Modell ein unvollständiges Lesen.',
  'note.failed': 'Das Modell erhielt den Platzhaltertext statt des Bildes.',
  'action.expand': 'Belegdetails anzeigen',
  'action.collapse': 'Belegdetails ausblenden',
  'duration.seconds': '{seconds}s',
} satisfies Record<keyof typeof en, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'meta.read': 'Прочитано {engine} · {duration}',
  'meta.reused': 'Прочитано {engine} · повторно',
  'meta.failed': 'Не удалось прочитать это изображение',
  'details.engine': 'Модель чтения',
  'details.attempts': 'Попытки',
  'details.time': 'Время',
  'note.cached': 'Использованы данные, сохранённые при прошлом чтении; вызов модели чтения не выполнялся.',
  'note.truncated': 'Данные были усечены, поэтому модель получила неполное описание.',
  'note.failed': 'Модель получила текстовую заглушку вместо изображения.',
  'action.expand': 'Показать подробности',
  'action.collapse': 'Скрыть подробности',
  'duration.seconds': '{seconds} с',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  'meta.read': 'Lido por {engine} · {duration}',
  'meta.reused': 'Lido por {engine} · reutilizado',
  'meta.failed': 'Não foi possível ler esta imagem',
  'details.engine': 'Motor',
  'details.attempts': 'Tentativas',
  'details.time': 'Tempo',
  'note.cached': 'Dados salvos em uma leitura anterior foram reutilizados; nenhuma chamada ao motor foi feita.',
  'note.truncated': 'Os dados foram truncados, então o modelo recebeu uma leitura incompleta.',
  'note.failed': 'O modelo recebeu o marcador de texto em vez da imagem.',
  'action.expand': 'Mostrar detalhes das evidências',
  'action.collapse': 'Ocultar detalhes das evidências',
  'duration.seconds': '{seconds}s',
} satisfies Record<keyof typeof en, string>
