import { config } from '../config/index';

export const getInternalHeaders = (extraHeaders: Record<string, any> = {}) => {
  return {
    ...extraHeaders,
    'x-internal-secret': config.internalApiSecret,
  };
};
