# Initio

Initio is an project designed to streamline the development of new applications and their accompanying documentation. Based on Typescript, Next.js, Zod, ReqctQuery, and the zod-to-openapi library—NextBase significantly reduces the overhead typically associated with these processes.

## Getting started

### Prerequisites

- pnpm v8.6.11
- node v18.17.0
- vscode

## Core Concepts

### Schema

At the heart of Initio is the Schema, a ZodObject that defines the structure for key elements of an API request, including query parameters, URL parameters, rquest body, and response. This robust schema validation ensures consistency and reliability across your application. The schemas will be located on each app acording to the domain of each app. This way every app can set their own scope foe each schema. An example of this schema could be `app/data/geo/schemas.ts` containing:

```typescript
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);
export namespace GeoDefinitions {
  export namespace Schemas {
    export const Coordinates = z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .openapi('Coordinates');

    export const LocationData = z
      .object({
        city: z.string(),
        state: z.string(),
        country: z.string(),
      })
      .openapi('LocationData');
  }

  export namespace Types {
    export type Coordinates = z.infer<typeof Schemas.Coordinates>;
    export type LocationData = z.infer<typeof Schemas.LocationData>;
  }
}
```

### Request Handler

Initio proposes a request/api driven development, this means that all the api endpoins are defined first setting the input, output, params and query formats so when handler function is defined it has access to auto complete features and the same happens with consumer. An example of a request definition can be as follow:

```typescript
import { createAPIDefinition } from 'ab-initio/dist/ab-initio';
import { GeoDefinitions } from './schemas';

export const getGeoData = createAPIDefinition({
  endpoint: '/geo',
  schemas: {
    queryParams: GeoDefinitions.Schemas.Coordinates,
    response: GeoDefinitions.Schemas.LocationData,
  },
});

export const postGeoData = createAPIDefinition({
  method: 'post',
  endpoint: '/geo',
  schemas: {
    payload: GeoDefinitions.Schemas.Coordinates,
    response: GeoDefinitions.Schemas.LocationData,
  },
});
```

And the used in the next api definition as follows:

```typescript
import { apiWrapper } from 'ab-initio/dist/server';
import { getGeoData, postGeoData } from '../../../data/geo/api';

export const GET = apiWrapper(getGeoData, async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('latitude');
  const long = searchParams.get('longitude');
  const locationResponse = await fetch(
    `https://geocode.xyz/${lat},${long}?json=1`,
  );
  const locationData = await locationResponse.json();
  return locationData.standard || locationData;
});

export const POST = apiWrapper(
  postGeoData,
  async (_request, _queryParams, payload) => {
    const lat = payload?.latitude;
    const long = payload?.longitude;
    const locationResponse = await fetch(
      `https://geocode.xyz/${lat},${long}?json=1`,
    );
    const locationData = await locationResponse.json();
    const fullData = locationData.standard || locationData;
    return {
      city: fullData.city,
      state: fullData.state,
      country: fullData.country,
    };
  },
);
```

### Consumer

Initio consumers are objects based in a request definition that uses react query internally to perform the comunication to the api. Even if api is not implemented in the next app, the definition of it will be helpful to use it on the auto generation of documentation and also the consumers. Here is an example to a consumer using the previous definition:

```typescript
'use client';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { apiConsumerClient } from 'ab-initio/dist/client';
import { Input } from '@next-base/lib-ui';
import { postGeoData } from 'apps/next-base/data/geo/api';

const geoDataConsumer = apiConsumerClient(postGeoData);

const GeoData = function Index() {
  const [latitude, setLatitude] = useState(19.3906594);
  const [longitude, setLongitude] = useState(-99.308425);
  const { query, queryKey } = geoDataConsumer(
    {
      body: {
        latitude,
        longitude,
      },
    },
    {},
  );

  const onChangeLatitude = (ev: ChangeEvent<HTMLInputElement>) => {
    setLatitude(Number(ev.target.value));
  };

  const onChangeLongitude = (ev: ChangeEvent<HTMLInputElement>) => {
    setLongitude(Number(ev.target.value));
  };

  if (query.isLoading) return <>Loading...</>;

  if (query.error) return <>Error</>;

  return (
    <>
      <Input
        placeholder="latitude"
        onChange={onChangeLatitude}
        value={latitude}
      />
      <Input
        placeholder="longitude"
        onChange={onChangeLongitude}
        value={longitude}
      />
      <br />
      <textarea style={{ width: '100%', height: '40px' }}>
        {JSON.stringify(query.data)}
      </textarea>
      <br />
      <textarea style={{ width: '100%', height: '40px' }}>
        {JSON.stringify(queryKey)}
      </textarea>
      <br />
    </>
  );
};

export default GeoData;
```

## Donate

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=BTJPCXNPH43YC)
