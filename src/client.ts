import {
  UseMutationResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { ZodType } from 'zod';
import { DTO } from './utils';
import { APIConsumerPayload, ConsumerFn, ConsumerFnClient, ServerFnDefinition } from './types';

const getEndpointWithArgsAndQuery = <
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  _Response extends ZodType,
>(
  endpoint: string,
  consumerPayload: APIConsumerPayload<
    DTO<URLParams>,
    DTO<QueryParams>,
    DTO<Body>
  >,
) => {
  let url = `${endpoint}${
    consumerPayload.query
      ? `?${new URLSearchParams(consumerPayload.query || {})}`
      : ''
  }`;

  if (consumerPayload && consumerPayload.urlParams) {
    Object.keys(consumerPayload.urlParams).forEach(
      (arg: keyof typeof consumerPayload.urlParams) => {
        url = url.replace(
          `{${arg as string}}`,
          consumerPayload?.urlParams![arg],
        );
      },
    );
  }

  return url;
};

export const _apiConsumer =
  <
    URLParams extends ZodType,
    QueryParams extends ZodType,
    Body extends ZodType,
    Response extends ZodType,
  >(
    endpoint: string,
    method: string,
  ): ConsumerFnClient<URLParams, QueryParams, Body, Response> =>
  (
    consumerPayload: APIConsumerPayload<
      DTO<URLParams>,
      DTO<QueryParams>,
      DTO<Body>
    >,
    ovewrites,
  ) => {
    // validate input data with provided schemas
    const endpointKey = getEndpointWithArgsAndQuery(endpoint, consumerPayload);
    const queryKey = [
      endpointKey,
      ...Object.values(consumerPayload.urlParams || {}),
      ...Object.values(consumerPayload.body || {}),
    ] as string[];

    const query = useQuery({
      ...ovewrites,
      queryKey,
      queryFn: async () => {
        const headers: any = {};
        try {
          if ((window as any).backendClient) {
            const {
              data: {
                session: {
                  user: { id },
                },
              },
            } = await (window as any).backendClient.auth.getSession();
            // headers['x-access-token'] = access_token;
            headers['x-user-id'] = id;
          }
        } catch (ex) {}
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}${endpointKey}`,
          {
            method,
            body: JSON.stringify(consumerPayload.body),
            headers: { ...consumerPayload.headers, ...headers },
          },
        );
        const jsonResponse = (await response.json()) as unknown as Response;
        return jsonResponse;
      },
    });

    return { queryKey, query };
  };

export const apiConsumer =
  <
    URLParams extends ZodType,
    QueryParams extends ZodType,
    Body extends ZodType,
    Response extends ZodType,
  >(
    apiDefinition: ServerFnDefinition<URLParams, QueryParams, Body, Response>,
  ): ConsumerFn<URLParams, QueryParams, Body, Response> =>
  async (
    consumerPayload: APIConsumerPayload<
      DTO<URLParams>,
      DTO<QueryParams>,
      DTO<Body>
    >,
  ) => {
    const endpointKey = getEndpointWithArgsAndQuery(
      apiDefinition?.endpoint || '/',
      consumerPayload,
    );
    const headers: any = {};
    try {
      if ((window as any).backendClient) {
        const {
          data: {
            session: {
              user: { id },
            },
          },
        } = await (window as any).backendClient.auth.getSession();
        // headers['x-access-token'] = access_token;
        headers['x-user-id'] = id;
      }
    } catch (ex) {}
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API_URL}${endpointKey}`,
      {
        method: apiDefinition.method || 'get',
        body: JSON.stringify(consumerPayload.body),
        headers: { ...consumerPayload.headers, ...headers },
      },
    );
    const jsonResponse = (await response.json()) as unknown as Response;
    return jsonResponse;
  };

export const apiConsumerClient = <
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  Response extends ZodType,
>(
  apiDefinition: ServerFnDefinition<URLParams, QueryParams, Body, Response>,
) => {
  const r = _apiConsumer<URLParams, QueryParams, Body, Response>(
    apiDefinition?.endpoint || '/',
    apiDefinition.method || 'get',
  );

  return r;
};

export const apiMutator = <
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  Response extends ZodType,
>(
  apiDefinition: ServerFnDefinition<URLParams, QueryParams, Body, Response>,
): UseMutationResult<unknown, Error, DTO<Body>, unknown> => {
  const mutation = useMutation<any, any, DTO<Body>, undefined>({
    mutationFn: async (data: DTO<Body>) => {
      const headers: any = {};
      if ((window as any).backendClient) {
        const sessionData = await (
          window as any
        ).backendClient.auth.getSession();

        if (sessionData && sessionData.data.session) {
          const {
            data: {
              session: {
                access_token,
                user: { id },
              },
            },
          } = sessionData;
          headers['x-access-token'] = access_token;
          headers['x-user-id'] = id;
        }
      }

      return fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}${apiDefinition.endpoint}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers,
        },
      );
    },
  });
  return mutation;
};
