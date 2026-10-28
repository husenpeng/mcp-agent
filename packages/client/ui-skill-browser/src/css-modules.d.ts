/** CSS Modules are typed as class-name maps in this package. */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
