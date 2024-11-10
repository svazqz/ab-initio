import { NextResponse } from 'next/server';
import { z, ZodType } from 'zod';
import { HandlerFn, NextBaseRequest, ServerFnDefinition } from './types';
import { validateQueryParams, validatePayload } from './utils';
import { useBackendClientServer } from './useBackendClientServer';

export const apiWrapper = <
  URLParams extends ZodType,
  QueryParams extends ZodType,
  Body extends ZodType,
  Response extends ZodType,
>(
  def: ServerFnDefinition<URLParams, QueryParams, Body, Response>,
  apiHandler: HandlerFn<URLParams, QueryParams, Body, Response>,
) => {
  const requestHandler = async (
    request: NextBaseRequest<z.infer<URLParams>, z.infer<QueryParams>>,
    { params }: { params: z.infer<URLParams> },
  ): Promise<NextResponse<z.infer<Response>>> => {
    let queryParams: QueryParams | undefined = undefined;
    const urlParams: URLParams | undefined = params;
    let parsedPayload: Body | undefined = undefined;

    if (def.auth) {
      const supabaseClient = await useBackendClientServer();
      const user = await supabaseClient.auth.getUser();
      const userId = request.headers.get('x-user-id');
      if (user?.data?.user?.id !== userId) {
        return new NextResponse(JSON.stringify({}), {
          status: 403,
          headers: { 'content-type': 'application/json' },
        });
      }
    }

    try {
      if (def.schemas?.queryParams) {
        queryParams = validateQueryParams(request, def) as QueryParams;
      }
    } catch (e) {
      return new NextResponse(
        JSON.stringify({
          error: (e as Error).message,
          at: 'query_validation',
        }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    try {
      if (def.schemas?.payload) {
        parsedPayload = (await validatePayload(
          request,
          def,
          undefined,
        )) as Body;
      }
    } catch (e) {
      return new NextResponse(
        JSON.stringify({
          error: (e as Error).message,
          at: 'payload_validation',
        }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    let responseHandler = undefined;
    try {
      responseHandler = await apiHandler(
        request,
        queryParams,
        urlParams,
        parsedPayload,
      );
    } catch (e) {
      return new NextResponse(
        JSON.stringify({
          error: (e as Error).message,
          at: 'response_handler',
        }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    if (def.schemas?.response && !def.skipOutputValidation) {
      try {
        def.schemas?.response?.parse(responseHandler);
      } catch (e) {
        return new NextResponse(
          JSON.stringify({
            error: (e as Error).message,
            at: 'response_validation',
          }),
          {
            status: 500,
            headers: { 'content-type': 'application/json' },
          },
        );
      }
    }

    const responseObject =
      typeof responseHandler === 'object'
        ? responseHandler
        : { data: responseHandler };

    return new NextResponse(JSON.stringify(responseObject), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return requestHandler;
};
