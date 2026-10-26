/** Left brand panel of the welcome login page, mirroring the company web login. */
import type { DesktopMessages } from '../locale.ts'

/** Marketing claims shown under the brand headline. */
const POINTS = ['welcomeAuthBrandPointBrief', 'welcomeAuthBrandPointCompetitor', 'welcomeAuthBrandPointCreators'] as const

/**
 * Render the brand aside: logo, badge, headline, lead paragraph, and value points.
 * @param props.messages - shell-owned localized copy.
 * @returns the decorative brand panel.
 */
export function BrandPanel({ messages: m }: { messages: DesktopMessages }) {
  return (
    <aside className="brandPanel">
      <div className="brandRow">
        <img className="brandLogo brandLogoLight" src="assets/tomato-mark-light.svg" alt="Tomato AI" width="36" height="36" />
        <img className="brandLogo brandLogoDark" src="assets/tomato-mark-dark.svg" alt="" aria-hidden="true" width="36" height="36" />
        <span className="brandWordmark" translate="no">Tomato AI</span>
      </div>

      <span className="brandBadge">
        <svg viewBox="0 0 16 16" fill="none" className="badgeSpark" aria-hidden="true">
          <path d="M8 1.5 9.2 5l3.3 1.2-3.3 1.2L8 11 6.8 7.4 3.5 6.2 6.8 5 8 1.5z" fill="currentColor" />
        </svg>
        {m.welcomeAuthBrandBadge}
      </span>

      <p className="brandHeading">
        {m.welcomeAuthBrandHeadingLead}
        <em>{m.welcomeAuthBrandHeadingEmphasis}</em>
        {m.welcomeAuthBrandHeadingTail}
      </p>

      <p className="brandLead">{m.welcomeAuthBrandLead}</p>

      <ul className="brandPoints">
        {POINTS.map(key => (
          <li key={key}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="pointCheck" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>{m[key]}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
