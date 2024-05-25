declare module '@citation/csl-style-all' {
    const info: {[key: string]: {
        title: string,
        title_short: string,
        id: string,
        short_id: string,
        parent: string | undefined,
        short_parent?: string,
        content: string,
        old_names?: string[]
    }}
    export default info
  }
  