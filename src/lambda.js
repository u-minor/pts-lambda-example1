'use strict';
const AWS = require('aws-sdk');
const gm = require('gm').subClass({imageMagick: true});

const s3 = new AWS.S3();

exports.handler = (event, context, callback) => {
  const bucket = event.Records[0].s3.bucket.name;
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const dstKey = srcKey.replace('images/', 'thumbnails/');

  const match = srcKey.match(/\.([^.]+)$/);
  if (!match) {
    console.log(`skipped: unable to get image type for key ${srcKey}`);
    callback(null, 'succeeded.');
    return;
  }

  const imageType = match[1];
  if (imageType !== 'jpg' && imageType !== 'png') {
    console.log(`skipped: non-image ${srcKey}`)
    callback(null, 'succeeded.');
    return;
  }

  s3.getObject({
    Bucket: bucket,
    Key: srcKey
  }).promise().then(data =>
    new Promise((resolve, reject) => {
      gm(data.Body)
        .resize(80, 80)
        .toBuffer(imageType, (error, buff) => {
          if (error) {
            reject(error);
            return;
          }
          resolve([data.ContentType, buff]);
        });
    })
  ).then(data =>
    s3.putObject({
      Bucket: bucket,
      Key: dstKey,
      Body: data[1],
      ContentType: data[0]
    }).promise()
  ).then(data => {
    console.log(data);
    callback(null, 'succeeded.');
  }).catch(error => {
    callback(error);
  });
};
