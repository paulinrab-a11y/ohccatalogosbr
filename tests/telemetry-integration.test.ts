import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BrowserClient } from '@sentry/react';
import { safeEvent } from '../src/lib/telemetry';
test('actual Sentry client captures error through privacy filter into a local fake transport',async()=>{
 const sent:unknown[]=[];
 const client=new BrowserClient({dsn:'https://publictest@o0.ingest.sentry.io/1',integrations:[],sendDefaultPii:false,beforeSend:event=>safeEvent(event),transport:()=>({send:envelope=>{sent.push(envelope);return Promise.resolve({statusCode:200});},flush:()=>Promise.resolve(true)})});
 client.captureException(new Error('private-person@example.invalid token=private-test-token'));
 assert.equal(await client.flush(2000),true);assert.equal(sent.length,1);
 const data=JSON.stringify(sent);assert.ok(!data.includes('private-person'));assert.ok(!data.includes('private-test-token'));assert.ok(data.includes('Application error'));
 await client.close();
});
