/**
 * The Marketing settings page: one group per advertising or marketing
 * provider, each with its switch and its credential controls. Credentials are
 * written through the credentials domain, never into the settings section, so
 * a literal never rides a response.
 */

import type {} from '@tomato/client-ui-plugin-manager/client'
import { SettingsForm, SettingsSecretField, Switch } from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import { formLabels } from './locales.ts'
import { PROVIDERS } from './marketing-card-controller.ts'
import styles from './MarketingCard.module.css'
import type { MarketingCardFace } from './marketing-card-controller.ts'

/** Props the renderer binds for the Marketing page. */
export type MarketingCardProps =
  PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.marketing'>
  & InjectFace<MarketingCardFace>

/**
 * Render the Marketing provider groups, or the page's one-liner, as the Plugins page asks.
 * @param props - the view asked for, locale copy, the form snapshot, and its actions.
 * @returns the one-liner, or the form.
 */
export function MarketingCard(props: MarketingCardProps) {
  const { t } = props
  const state = props.useMarketingCard(snapshot => snapshot)
  if (props.view === 'summary') return t('description')
  const disabled = !state.writable || state.saving
  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      {PROVIDERS.map((provider) => {
        const rendered = state.providers.find(candidate => candidate.id === provider.id)
        return (
          <section key={provider.id} className={styles.group}>
            <div className={styles.header}>
              <div className={styles.copy}>
                <h3 className={styles.title}>{t(provider.title)}</h3>
                <p className={styles.hint}>{t(provider.hint)}</p>
              </div>
              <label className={styles.toggle}>
                <span>{t('enable')}</span>
                <Switch
                  checked={rendered?.enabled ?? false}
                  label={t('enable')}
                  disabled={disabled}
                  onChange={(checked) => { props.setProvider(provider.id, checked) }}
                />
              </label>
            </div>
            {provider.secrets.map((secret) => {
              const view = rendered?.secrets.find(candidate => candidate.field === secret.field)
              return (
                <SettingsSecretField
                  key={secret.field}
                  id={`plugin-config-marketing-${secret.field}`}
                  label={t(secret.label)}
                  hint={t(secret.hint)}
                  disabled={disabled || view?.writable === false}
                  text={view?.text ?? ''}
                  configured={view?.configured ?? false}
                  stateLabel={view?.configured === true ? t('configured') : t('notConfigured')}
                  onEdit={(text) => { props.edit(secret.field, text) }}
                />
              )
            })}
          </section>
        )
      })}
    </SettingsForm>
  )
}
