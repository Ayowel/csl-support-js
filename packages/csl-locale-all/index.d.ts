declare module '@citation/csl-locale-all' {
  const content: {[key: string]: string}
  const mappings: {'language-names': {[key: string]: string}, 'primary-dialects': {[key: string]: string}}
  export default content
  export { mappings }
}
