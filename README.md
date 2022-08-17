# Tiktok Comments and Likes Scraper

Super basic Puppeteer crawler(s) for scraping comments and like counts from
TikTok. Give the crawler a list of TikTok URLs (from the web), and it will
produce a CSV containing (some of) the comments from the video, and the
number of likes, shares and comments.

Because TikTok behavior might be different if you are not a logged in user,
the crawler is set up to use the existing Chrome installation rather than
the Chromium binary packaged with puppeteer. Thus, you can log in with your
TikTok account manually, and then the crawler will visit TikToks using
your account.

One important limitation to note - this scraper may not collect all comments
from videos, especially those with extremely high numbers of comments. Crawling
comments requires expanding replies and continuously loading comments in an 
infinite scroll interface, so for convenience, at the time we did this project,
we set a reasonable timeout.

This tool played a minor part in data collection for our paper:
> [**Anti-Privacy and Anti-Security Advice on TikTok: Case Studies of Technology-Enabled Surveillance and Control in Intimate Partner and Parent-Child Relationships**](https://www.usenix.org/conference/soups2022/presentation/wei)
>
> Miranda Wei, Eric Zeng, Tadayoshi Kohno, Franziska Roesner
>
> Symposium On Usable Privacy and Security 2022


## Runbook

1. Launch Chrome with the flag `--remote-debugging-port=21222`
2. Log into TikTok in your Chrome browser
3. Create a CSV with fields `ID` and `URL` containing the TikToks you want to crawl. ID is a user-supplied ID for the video, URL is the web URL for the video.
5. Run `npm install` to install dependencies
6. Run `tsc` to compile
7. Run `node comments.js <input csv file>` to scrape comments
8. Run `node likes.js <input csv file>` to scrape like, comment, and share counts
