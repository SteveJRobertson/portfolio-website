export type TeletextColor = 
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'black';

export interface FastTextLink {
  label: string;
  page: number;
  path: string;
  color: 'red' | 'green' | 'yellow' | 'cyan';
}

export interface TeletextRowData {
  color?: TeletextColor;
  bg?: TeletextColor;
  text: string;
}

export interface TeletextPageData {
  pageNumber: number;
  title: string;
  path: string;
  fastText: {
    red: FastTextLink;
    green: FastTextLink;
    yellow: FastTextLink;
    cyan: FastTextLink;
  };
  desktopRows: TeletextRowData[];
  mobileRows?: TeletextRowData[];
  semanticContent: {
    heading: string;
    body: string[];
    links?: { label: string; url: string }[];
  };
}
