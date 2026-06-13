declare module "@retorquere/bibtex-parser" {
  export type BibEntry = {
    type: string;
    key: string;
    fields: Record<string, unknown>;
  };

  export type BibParseResult = {
    entries: BibEntry[];
    errors: unknown[];
  };

  export function parse(input: string): BibParseResult;
}
