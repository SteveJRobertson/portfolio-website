import type { Meta, StoryObj } from '@storybook/react-vite';
import { TeletextGrid } from '../components/TeletextGrid';
import { GridLine } from '../components/GridLine';
import { fitRow } from '../display/rows';
import { layoutRows } from './wrap';
import type { RowSource } from './schema';

interface MarkupProps {
  /** One logical line per entry, as written in a page JSON file. */
  lines: RowSource[];
  width: number;
}

/** Lays out page markup exactly as the build does, at a chosen width. */
const Markup = ({ lines, width }: MarkupProps) => {
  const { rows, errors } = layoutRows(lines, width);
  const heights = rows.map((r) => (r.doubleHeight ? 2 : 1) as 1 | 2);
  const starts = heights.map((_, i) => 1 + heights.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div style={{ fontSize: 24 }}>
      <TeletextGrid cols={width} rows={heights.reduce((a, b) => a + b, 0)}>
        {rows.map((row, i) => (
          <GridLine key={i} row={starts[i]} width={width} height={heights[i]} content={fitRow(row, width)} />
        ))}
      </TeletextGrid>
      {errors.length > 0 && <pre style={{ color: '#FF3333' }}>{errors.join('\n')}</pre>}
    </div>
  );
};

const meta: Meta<typeof Markup> = {
  title: 'Content/Markup',
  component: Markup,
  args: {
    width: 38,
    lines: [
      { text: '{yellow}DOUBLE HEIGHT{/}', doubleHeight: true },
      '{blue}{rule}{/}',
      'Plain text is white. {cyan}Colour tags{/} change the foreground, {bg:blue}{yellow} backgrounds {/}{/} too.',
      '{red}Red{/} {green}green{/} {yellow}yellow{/} {blue}blue{/} {magenta}magenta{/} {cyan}cyan{/} {white}white{/}',
      '',
      'Inline links are cyan: see {link:110}110{/} for experience.',
      '* Bullets hang their continuation lines under the first word.',
      '201  Page numbers hang too, which suits directory pages.',
      '{yellow}{rule:-}{/}',
      'URLs break after a slash: github.com/SteveJRobertson/lighthouse-compare',
      'Literal braces: {{like this}',
    ],
  },
  argTypes: { width: { control: 'inline-radio', options: [38, 20] } },
};

export default meta;
type Story = StoryObj<typeof Markup>;

export const Wide: Story = {};
export const Portrait: Story = { args: { width: 20 } };
export const Errors: Story = { args: { lines: ['{orange}Unknown tag{/}', '{cyan}Unclosed', 'Stray {/}'] } };
