/** Locale bundles for the Marketing settings page. */

import type { SettingsFormLabels } from '@tomato/client-ui-primitives'

/** Locale keys the page renders. */
export type MarketingSettingsLocaleKey =
  | 'title' | 'description'
  | 'enable' | 'enableHint'
  | 'googleAds' | 'googleAdsHint' | 'googleAdsDeveloperToken' | 'googleAdsDeveloperTokenHint'
  | 'googleAnalytics' | 'googleAnalyticsHint' | 'googleAnalyticsCredentials' | 'googleAnalyticsCredentialsHint'
  | 'mosaic' | 'mosaicHint' | 'mosaicMetaToken' | 'mosaicTiktokToken' | 'mosaicYoutubeToken' | 'mosaicXToken' | 'mosaicTokenHint'
  | 'mailchimp' | 'mailchimpHint' | 'mailchimpApiKey' | 'mailchimpApiKeyHint'
  | 'configured' | 'notConfigured'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable' | 'save' | 'saving' | 'saveFailed'

/** English copy. */
export const en: Record<MarketingSettingsLocaleKey, string> = {
  title: 'Marketing',
  description: 'Connect advertising and marketing platforms: Google Ads, Analytics, Meta/Instagram, TikTok, YouTube, X, and Mailchimp.',
  enable: 'Enable',
  enableHint: 'Off until switched on. A provider also needs the credentials below before its tools appear.',
  googleAds: 'Google Ads',
  googleAdsHint: 'Reads campaigns and reports through the Google Ads MCP server. Needs a developer token with at least Explorer access.',
  googleAdsDeveloperToken: 'Developer token',
  googleAdsDeveloperTokenHint: 'Stored outside the settings file. The server reads it as GOOGLE_ADS_DEVELOPER_TOKEN.',
  googleAnalytics: 'Google Analytics 4',
  googleAnalyticsHint: 'Reports GA4 metrics through the Google Analytics MCP server. Needs a service-account JSON key file.',
  googleAnalyticsCredentials: 'Service-account key file',
  googleAnalyticsCredentialsHint: 'Path to the JSON key file. The server reads it as GOOGLE_APPLICATION_CREDENTIALS.',
  mosaic: 'Meta, Instagram, TikTok, YouTube, X',
  mosaicHint: 'One MCP server for publishing, metrics, and ad operations across these platforms. Any one token is enough to start it.',
  mosaicMetaToken: 'Meta access token',
  mosaicTiktokToken: 'TikTok access token',
  mosaicYoutubeToken: 'YouTube access token',
  mosaicXToken: 'X access token',
  mosaicTokenHint: 'Stored outside the settings file. Leave blank to keep a platform out of the server.',
  mailchimp: 'Mailchimp',
  mailchimpHint: 'Reads audiences and campaigns through the Mailchimp MCP server.',
  mailchimpApiKey: 'API key',
  mailchimpApiKeyHint: 'Stored outside the settings file. The server reads it as MAILCHIMP_API_KEY.',
  configured: 'A credential is configured.',
  notConfigured: 'No credential is configured yet.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
}

/** Simplified Chinese copy. */
export const zh: Record<MarketingSettingsLocaleKey, string> = {
  title: '营销',
  description: '接入广告与营销平台：Google Ads、Analytics、Meta/Instagram、TikTok、YouTube、X 与 Mailchimp。',
  enable: '启用',
  enableHint: '默认不开启；除了打开开关，还需要填写下面的凭据，插件才会挂载对应的服务。',
  googleAds: 'Google Ads',
  googleAdsHint: '通过 Google Ads MCP 服务读取广告系列与报表，需要至少 Explorer 权限的开发者令牌。',
  googleAdsDeveloperToken: '开发者令牌',
  googleAdsDeveloperTokenHint: '不写入设置文件；服务端按 GOOGLE_ADS_DEVELOPER_TOKEN 读取。',
  googleAnalytics: 'Google Analytics 4',
  googleAnalyticsHint: '通过 Google Analytics MCP 服务读取 GA4 指标，需要服务账号的 JSON 密钥文件。',
  googleAnalyticsCredentials: '服务账号密钥文件',
  googleAnalyticsCredentialsHint: 'JSON 密钥文件的路径；服务端按 GOOGLE_APPLICATION_CREDENTIALS 读取。',
  mosaic: 'Meta、Instagram、TikTok、YouTube、X',
  mosaicHint: '一个 MCP 服务覆盖这些平台的发布、指标与广告操作；任意一个平台的令牌可用即可启动。',
  mosaicMetaToken: 'Meta 访问令牌',
  mosaicTiktokToken: 'TikTok 访问令牌',
  mosaicYoutubeToken: 'YouTube 访问令牌',
  mosaicXToken: 'X 访问令牌',
  mosaicTokenHint: '不写入设置文件；留空表示该平台不参与。',
  mailchimp: 'Mailchimp',
  mailchimpHint: '通过 Mailchimp MCP 服务读取受众与营销活动。',
  mailchimpApiKey: 'API Key',
  mailchimpApiKeyHint: '不写入设置文件；服务端按 MAILCHIMP_API_KEY 读取。',
  configured: '已配置凭据。',
  notConfigured: '尚未配置凭据。',
  overridden: '已覆盖',
  reset: '恢复默认',
  readOnly: '本部署的设置为只读。',
  unavailable: '该插件当前未加载，暂时无法配置。',
  save: '保存',
  saving: '保存中…',
  saveFailed: '本部署没有接受这些值，已保留供你修改。',
}

/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: MarketingSettingsLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}
