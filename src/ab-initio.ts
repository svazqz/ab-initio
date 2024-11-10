/* eslint-disable @typescript-eslint/no-var-requires */
import { ZodType } from 'zod';
import { setOpenAPIMetadata } from './utils';
import { ServerFnDefinition } from './types';

export const createAPIDefinition = <
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  Response extends ZodType,
>(
  def: ServerFnDefinition<URLParams, QueryParams, Body, Response>,
): ServerFnDefinition<URLParams, QueryParams, Body, Response> => {
  const _def = {
    method: 'get',
    ...def,
    ...{ endpoint: `${def.endpoint || ''}` },
  };

  if (process.env.API_EXPORTER) {
    (_def as any).apiConfig = setOpenAPIMetadata(_def);
  }

  return _def;
};
