/*!
 * Copyright (c) 2017-present Ghostery GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { fullLists } from '../src/index.js';
import { IPattern } from '../src/engine/metadata/patterns.js';
import { ICategory } from '../src/engine/metadata/categories.js';
import { IOrganization } from '../src/engine/metadata/organizations.js';

export function loadEasyListFilters(): string[] {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'data', 'easylist.json'), { encoding: 'utf-8' }),
  );
}

function readAsset(filepath: string) {
  return fs.readFileSync(path.resolve(__dirname, '../', filepath), 'utf-8');
}

const PREFIX =
  'https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets';

export const allLists = (() => {
  return [
    ...fullLists.map((p) => path.join('assets', p.slice(PREFIX.length))),
    'test/data/customs.txt',
  ]
    .map((p) => readAsset(p))
    .join('\n');
})();

export function loadResources() {
  return readAsset('assets/ublock-origin/resources.json');
}

export function getNaughtyStrings(): string[] {
  return fs.readFileSync(path.resolve(__dirname, 'data', 'blns.txt'), 'utf-8').split('\n');
}

type TrackerDB = {
  patterns: Record<string, IPattern>;
  categories: Record<string, ICategory>;
  organizations: Record<string, IOrganization>;
};

export function getRawTrackerDB(): TrackerDB {
  const trackerdb: TrackerDB = JSON.parse(
    zlib
      .unzipSync(fs.readFileSync(path.resolve(__dirname, 'data', 'trackerdb_20221213.json.gz')))
      .toString('utf-8'),
  );

  for (const [key, pattern] of Object.entries(trackerdb.patterns)) {
    if (pattern !== null && typeof pattern === 'object') {
      Object.assign(pattern, { key });
    }
  }

  for (const [key, category] of Object.entries(trackerdb.categories)) {
    if (category !== null && typeof category === 'object') {
      Object.assign(category, { key });
    }
  }

  for (const [key, organization] of Object.entries(trackerdb.organizations)) {
    if (organization !== null && typeof organization === 'object') {
      Object.assign(organization, { key });
    }
  }

  return trackerdb;
}

export function typedArrayDiff(arr1: Uint8Array, arr2: Uint8Array): string[] {
  const differences: string[] = [];
  if (arr1.byteLength !== arr2.byteLength) {
    differences.push(
      `Diff (length): ${JSON.stringify({
        arr1_length: arr1.byteLength,
        arr2_length: arr2.byteLength,
      })}`,
    );
    return differences;
  }

  for (let i = 0; i < arr1.byteLength; i += 1) {
    if (arr1[i] !== arr2[i]) {
      differences.push(
        `Diff (values): ${JSON.stringify({
          arr1: arr1[i],
          arr2: arr2[i],
          i,
        })}`,
      );
      break;
    }
  }

  return differences;
}

export function typedArrayEqual(arr1: Uint8Array, arr2: Uint8Array): boolean {
  return typedArrayDiff(arr1, arr2).length === 0;
}

export function getRequestSamplePath(url: string): string {
  return path.resolve(__dirname, 'data/samples', url.replace(/[^a-z0-9.]/g, '_') + '.br');
}

export function loadRequestSample(path: string): string {
  return zlib.brotliDecompressSync(fs.readFileSync(path)).toString('utf8');
}
