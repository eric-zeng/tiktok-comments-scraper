import csv from 'csv-parser';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { parse } from 'json2csv';


function readCsv(file: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(file)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      resolve(results);
    });
  })
}

async function main() {
  const browserURL = 'http://127.0.0.1:21222';
  const browser = await puppeteer.connect({browserURL});

  let p = await browser.newPage();

  const rows = await readCsv(process.argv[2]);
  let firstRow = true;
  for (let row of rows) {
    let output = [];
    try {
      console.log(row.ID + ': ' + row.URL);
      await p.goto(row.URL);
      let likes = await p.$eval('[data-e2e="like-count"]', (e) => e.textContent);
      let comments = await p.$eval('[data-e2e="comment-count"]', (e) => e.textContent);
      let shares = await p.$eval('[data-e2e="share-count"]', (e) => e.textContent);

      output.push({
        tiktok_id: Number.parseInt(row.ID),
        likes: likes,
        shares: shares,
        comments: comments
      });
    } catch (e) {
      output.push({
        tiktok_id: Number.parseInt(row.ID),
        likes: -1,
        shares: -1,
        comments: -1
      });
    }

    const fields = ['tiktok_id', 'likes', 'comments', 'shares'];
    const opts = { fields, header: firstRow };
    try {
      let csv = parse(output, opts);
      fs.writeFileSync('likes.csv', csv + '\n', { flag: 'a' });
    } catch (err) {
      console.log(err);
    }
    firstRow = false;
    await p.waitForTimeout(1000);
  }

  console.log('Done');
}

main();
