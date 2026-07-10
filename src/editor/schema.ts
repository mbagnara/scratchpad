import { BlockNoteSchema, createCodeBlockSpec, defaultBlockSpecs } from '@blocknote/core';
import { calloutBlockSpec } from './blocks/Callout';

export const editorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    callout: calloutBlockSpec(),
    codeBlock: createCodeBlockSpec({
      defaultLanguage: 'javascript',
      supportedLanguages: {
        javascript: { name: 'JavaScript', aliases: ['js'] },
        python: { name: 'Python', aliases: ['py'] },
        sql: { name: 'SQL' },
        json: { name: 'JSON' },
        yaml: { name: 'YAML', aliases: ['yml'] },
        bash: { name: 'Bash', aliases: ['sh', 'shell'] },
      },
    }),
  },
});
