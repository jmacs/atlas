import pino, {type TransportTargetOptions} from 'pino';

import {CONFIG} from '#config';

const prettyOptions = {
  colorize: false,
  ignore: 'pid,hostname,time,level',
  messageFormat: '[{time}] [{levelLabel}] {msg}',
  singleLine: true,
  useOnlyCustomProps: false,
};

const targets: TransportTargetOptions[] = [
  {
    target: 'pino-pretty',
    options: prettyOptions,
  },
  {
    target: 'pino-pretty',
    options: {
      ...prettyOptions,
      destination: CONFIG.paths.applicationLog,
      mkdir: true,
    },
  },
];

const transport = pino.transport({
  targets,
});

export const logger = pino({timestamp: pino.stdTimeFunctions.isoTime}, transport);
