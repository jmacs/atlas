import {defineAction} from '../action.ts';

type Payload = {value: string};

function validatePayload(value: unknown): asserts value is Payload {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !('value' in value) ||
    typeof value.value !== 'string'
  ) {
    throw new Error('Choose a string value');
  }
}

export const runAction = defineAction(validatePayload, async (payload, logger) => {
  logger.info(payload, 'Fixture action completed');
  return payload;
});
