import { z, ZodType } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest } from 'next/types';
import { UseQueryResult } from '@tanstack/react-query';
import { DTO } from './utils';

export type NextBaseRequest<_P, Q> = NextRequest &
  NextApiRequest & {
    nextUrl: { searchParams: { get: (key: keyof Q) => any } };
  };

export type NextRequestHandler<
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Response extends ZodType,
> = (
  request: NextBaseRequest<z.infer<URLParams>, z.infer<QueryParams>>,
) => Promise<z.infer<Response>>;

export type HandlerFn<
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  Response extends ZodType,
> = (
  request: NextBaseRequest<z.infer<URLParams>, z.infer<QueryParams>>,
  queryParams?: z.infer<QueryParams>,
  urlParams?: z.infer<URLParams>,
  payload?: z.infer<Body>,
) => Promise<z.infer<Response>>;

export type ServerFnDefinition<
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  Response extends ZodType,
> = {
  schemas?: {
    urlArgs?: URLParams;
    queryParams?: QueryParams;
    payload?: Body;
    response?: Response;
  };
  endpoint?: string;
  method?: string;
  protoIn?: string;
  protoOut?: string;
  setHandler?: (
    handlerFn: HandlerFn<URLParams, QueryParams, Body, Response>,
  ) => (
    request: NextBaseRequest<URLParams, QueryParams>,
    { params }: { params: z.infer<URLParams> },
  ) => NextResponse<Response> | Promise<NextResponse<Response>>;
  auth?: () => Promise<boolean>;
  skipOutputValidation?: boolean;
};

export type APIConsumerPayload<URLParams, QueryParams, Body> = {
  urlParams?: URLParams;
  query?: QueryParams;
  body?: Body;
  headers?: Record<string, string>;
};

export type ConsumerFn<
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  Response extends ZodType,
> = (
  consumerPayload: APIConsumerPayload<
    DTO<URLParams>,
    DTO<QueryParams>,
    DTO<Body>
  >,
) => Promise<DTO<Response>>;

export type ConsumerFnClient<
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  Response extends ZodType,
> = ((
  consumerPayload: APIConsumerPayload<
    DTO<URLParams>,
    DTO<QueryParams>,
    DTO<Body>
  >,
  ovewrites: {
    initialData?: DTO<Response>;
    enabled?: boolean;
  },
) => {
  queryKey: string[];
  query: UseQueryResult<DTO<Response>>;
}) & {
  types?: {
    urlParams?: URLParams;
    queryParams?: QueryParams;
    payload?: Body;
    response?: Response;
  };
};