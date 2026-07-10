import { createReactBlockSpec } from '@blocknote/react';
import './Callout.css';

export const CALLOUT_VARIANTS = ['idea', 'important', 'warning', 'reference', 'success'] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

const VARIANT_ICON: Record<CalloutVariant, string> = {
  idea: '💡',
  important: '❗',
  warning: '⚠️',
  reference: '📚',
  success: '✅',
};

export const calloutBlockSpec = createReactBlockSpec(
  {
    type: 'callout',
    propSchema: {
      variant: { default: 'idea', values: CALLOUT_VARIANTS },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      const variant = props.block.props.variant as CalloutVariant;
      return (
        <div className={`callout callout--${variant}`}>
          <span className="callout__icon">{VARIANT_ICON[variant]}</span>
          <div className="callout__content" ref={props.contentRef} />
          <select
            className="callout__select"
            contentEditable={false}
            value={variant}
            onChange={(e) =>
              props.editor.updateBlock(props.block, {
                type: 'callout',
                props: { variant: e.target.value as CalloutVariant },
              })
            }
          >
            {CALLOUT_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {VARIANT_ICON[v]} {v}
              </option>
            ))}
          </select>
        </div>
      );
    },
  },
);
