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

  let i = 0;
  let firstRow = true;
  for (let row of rows) {
    let output = [];
    console.log(row.ID + ': ' + row.URL);
    await p.goto(row.URL);
    let commentIcon = await p.$('[data-e2e="comment-icon"]')
    await commentIcon?.click();

    await p.waitForTimeout(5000);

    let commentPanel = await p.$('[class*="DivCommentListContainer"]');
    if (!commentPanel) {
      console.log('Can\'t find comments on URL ' + row.URL);
      continue;
    }
    let scrolling = true;
    let scroll_i = 0;
    while (scrolling) {
      let scrollHeight = await commentPanel.evaluate(e => e.scrollHeight);
      await commentPanel.evaluate(e => e.scroll({ top: e.scrollHeight }));
      await p.waitForTimeout(400);
      let newScrollHeight = await commentPanel.evaluate(e => e.scrollHeight);
      if (scrollHeight == newScrollHeight) {
        break;
      }
      scroll_i++;
      if (scroll_i >= 10) {
        break;
      }
    }

    let comments = await p.$$('[class*="DivCommentItemContainer"]');
    for (let comment of comments) {
      let username = await comment.$eval('[data-e2e^="comment-username"]', e => e.textContent);
      let content = await comment.$eval('[data-e2e^="comment-level"]', e => e.textContent);
      let time = await comment.$eval('[data-e2e^="comment-time"]', e => e.textContent);
      let likes = await comment.$eval('[data-e2e="comment-like-count"]', e => e.textContent);

      i++;
      output.push({
        'tiktok_id': row.ID,
        'comment_id': i,
        'username': username,
        'content': content,
        'timestamp': time,
        'likes': likes ? Number.parseInt(likes) : undefined
      });

      let replyExpand = await comment.$('[data-e2e^="view-more"]');
      if (replyExpand) {
        // console.log('expanding replies')
        await replyExpand.click();
        await p.waitForTimeout(800);
      }
      let thread = await comment.$('[class*="DivReplyContainer"]');
      if (thread) {
        // console.log('thread found');
        replyExpand = await thread.$('[data-e2e^="view-more"]');
        try {
          if (replyExpand) {
            await replyExpand.click();
            await p.waitForTimeout(800);
          }
        } catch (e) {
          console.log('thread expand error');
        }

        let subcomments = await thread.$$('[class*="DivCommentContentContainer"]');
        let topCommentId = i;
        for (let subcomment of subcomments) {
          let username = await subcomment.$eval('[data-e2e^="comment-username"]', e => e.textContent);
          let content = await subcomment.$eval('[data-e2e^="comment-level"]', e => e.textContent);
          let time = await subcomment.$eval('[data-e2e^="comment-time"]', e => e.textContent);
          let likes = await subcomment.$eval('[data-e2e="comment-like-count"]', e => e.textContent);

          i++;
          output.push({
            'tiktok_id': row.ID,
            'comment_id': i,
            'username': username,
            'content': content,
            'timestamp': time,
            'likes': likes ? Number.parseInt(likes) : undefined,
            'reply_to': topCommentId
          });
        }
      }
    }
    const fields = ['tiktok_id', 'comment_id', 'username', 'content', 'timestamp', 'likes', 'reply_to'];
    const opts = { fields, header: firstRow };
    try {
      let csv = parse(output, opts);
      fs.writeFileSync('comments.csv', csv, { flag: 'a' });
    } catch (err) {
      console.log(err);
    }
    firstRow = false;
  }

  console.log('Done');
}

main();
