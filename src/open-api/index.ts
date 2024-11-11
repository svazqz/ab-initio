/* eslint-disable @typescript-eslint/no-unused-vars*/

import * as fs from 'fs';
import { z } from 'zod';
import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { exec } from 'child_process';

const baseDir = `${process.cwd()}`;
const indexPath = process.argv[3];
const outPath = process.argv[4] || `${baseDir}/dist`;

if (process.argv.length < 4) {
  throw new Error('You need to specify the index file (relative to project root) for API generation.');
}

const registry = new OpenAPIRegistry();
extendZodWithOpenApi(z);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const apiDefinitions = require(`${baseDir}/${indexPath}`);

const command = `mkdir -p ${outPath}/apps/openapi`;
exec(command, (err, _stdout, _stderr) => {
  if (err) {
    // node couldn't execute the command
    throw new Error(JSON.stringify(err));
  }
  try {
    Object.entries(apiDefinitions).forEach(([_namespace, definitions]) => {
      Object.entries(definitions as any).forEach(([_key, def]) => {
        registry.registerPath((def as any).apiConfig);
      });
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);

    const result = generator.generateDocument({
      info: {
        title: '',
        version: '1',
      },
      openapi: '3.0.0',
    });

    fs.writeFileSync(
      `${outPath}/apps/openapi/docs.json`,
      JSON.stringify(result, null, 2),
      {
        encoding: 'utf-8',
      },
    );

    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log(JSON.stringify(e));
  }
});
