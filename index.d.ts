type ResultItem = {
  title: string;
  description: string;
  url: string;
};

type TimeRange = "day" | "month" | "year";

export type subSearch = (params: {
  query: string;
  language?: string;
  time_range?: TimeRange;
  pageno?: number;
}) => Promise<Array<ResultItem>>;

export type searchAll = (params: {
  query: string;
  engines?: string[];
}) => Promise<{
  query: string;
  number_of_results: number;
  enabled_engines: string[];
  unresponsive_engines: string[];
  results: Array<ResultItem>;
}>;
