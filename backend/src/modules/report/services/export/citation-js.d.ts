// Type declarations for citation-js
declare module 'citation-js' {
  export class Cite {
    constructor(data: any, options?: any);
    static async(input: any, options?: any): Promise<Cite>;
    format(style: string, options?: any): string;
    data: any[];
  }

  export default Cite;
}
