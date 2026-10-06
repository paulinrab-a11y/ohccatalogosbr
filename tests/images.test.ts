import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { sanitizeImage } from '../server/images.js';

test('server decodes real pixels, preserves dimensions and strips EXIF', async () => {
 const input = await sharp({create:{width:12,height:8,channels:3,background:'#123456'}}).withMetadata({exif:{IFD0:{Artist:'synthetic-private-person'}}}).png().toBuffer();
 const output = await sanitizeImage({content_type:'image/png',size:input.length,data:input.toString('base64')});
 const info = await sharp(output).metadata();
 assert.equal(info.format,'webp'); assert.equal(info.width,12); assert.equal(info.height,8); assert.equal(info.exif,undefined);
 const original=await sharp(input).raw().toBuffer(), pixels=await sharp(output).raw().toBuffer(); assert.deepEqual(pixels,original);
});
test('server rejects signature-only files, mismatched MIME, forged size and excess pixels', async () => {
 for (const bytes of [Buffer.from('RIFF0000WEBP'), Buffer.from([137,80,78,71,13,10,26,10])]) await assert.rejects(sanitizeImage({content_type:'image/webp',data:bytes.toString('base64')}), {status:400});
 const input=await sharp({create:{width:4,height:4,channels:3,background:'white'}}).png().toBuffer();
 await assert.rejects(sanitizeImage({content_type:'image/jpeg',data:input.toString('base64')}),{status:400});
 await assert.rejects(sanitizeImage({content_type:'image/png',size:1,data:input.toString('base64')}),{status:400});
 const big=await sharp({create:{width:4001,height:4000,channels:3,background:'white'}}).png().toBuffer();
 await assert.rejects(sanitizeImage({content_type:'image/png',data:big.toString('base64')}),{status:400});
});
test('server never hands SVG or other non-raster input to libvips loaders (GHSA-wq5f-xc86-pv6w)', async () => {
 const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4"/></svg>');
 await assert.rejects(sharp(svg).metadata(),/unsupported image format|blocked/);
 await assert.rejects(sanitizeImage({content_type:'image/png',data:svg.toString('base64')}),{status:400});
 const tiff=await sharp({create:{width:4,height:4,channels:3,background:'white'}}).tiff().toBuffer();
 await assert.rejects(sharp(tiff).metadata(),/unsupported image format|blocked/);
 const webp=await sharp({create:{width:4,height:4,channels:3,background:'white'}}).webp().toBuffer(), jpeg=await sharp({create:{width:4,height:4,channels:3,background:'white'}}).jpeg().toBuffer();
 assert.equal((await sharp(await sanitizeImage({content_type:'image/webp',data:webp.toString('base64')},{webpOnly:true})).metadata()).format,'webp');
 assert.equal((await sharp(await sanitizeImage({content_type:'image/jpeg',data:jpeg.toString('base64')})).metadata()).format,'webp');
});

import { publicInput } from '../server/publicInput.js';
test('public input requires consent and strict types and discards administrative fields', () => {
 const valid={vehicle_brand:'Synthetic',vehicle_model:'Test',vehicle_year:2025,consent_data_images:true};
 assert.equal(publicInput({...valid,role:'ohc_admin'}).role,undefined);
 for(const delta of [{vehicle_year:'2025'},{vehicle_brand:{}},{vehicle_model:'a'.repeat(121)},{consent_data_images:false}]) assert.throws(()=>publicInput({...valid,...delta}),{status:400});
});
