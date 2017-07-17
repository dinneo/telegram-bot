const { MongoClient } = require('mongodb');

const config = require('../env/development');

MongoClient.connect(config.mongodbPath, async (err, db) => {
  const localDb = await MongoClient.connect('mongodb://localhost:27017/ppav');
  const logs = localDb.collection('logs');

  let arr = await logs
    .aggregate([
      {
        $group: {
          _id: '$messageText',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gte: 100 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          messageText: '$_id',
          count: 1,
        },
      },
    ])
    .toArray();

  const now = new Date();
  /* eslint-disable no-param-reassign */
  arr = arr.map(each => {
    if (each.messageText[0] === '%' || each.messageText[0] === '％') {
      each.type = 'models';
    } else if (each.messageText[0] === '#' || each.messageText[0] === '＃') {
      each.type = 'code';
    } else if (each.messageText[0] === '@' || each.messageText[0] === '＠') {
      each.type = 'name';
    } else if (each.messageText[0] === '!' || each.messageText[0] === '！') {
      each.type = 'tags';
    }

    each.messageText = each.messageText.slice(1);
    each.updated_at = now;

    return each;
  });

  arr = arr.filter(each => each.type !== undefined && each.messageText !== '');

  const keyword = db.collection('search_keywords');
  /* eslint-disable no-restricted-syntax */
  /* eslint-disable no-await-in-loop */
  for (const each of arr) {
    await keyword.updateOne(
      { keyword: each.messageText, type: each.type },
      {
        $inc: { count: each.count },
        $set: { updated_at: each.updated_at },
      },
      { upsert: true }
    );
  }

  console.log(arr);

  await localDb.close();
  await db.close();
});
