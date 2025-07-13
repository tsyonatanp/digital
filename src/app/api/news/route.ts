import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

const parser = new Parser()

const RSS_FEEDS = {
  ynet: 'https://www.ynet.co.il/Integration/StoryRss2.xml',
  one: 'https://www.one.co.il/cat/xml/rss/rss.aspx',
  globes: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=585'
}

export async function GET() {
  try {
    const newsItems = []

    // Fetch from Ynet
    try {
      const feed = await parser.parseURL(RSS_FEEDS.ynet)
      const items = feed.items.slice(0, 7).map(item => ({
        title: item.title || '',
        link: item.link || '',
        source: 'ynet'
      }))
      newsItems.push(...items)
    } catch (error) {
      console.error('Error fetching from Ynet:', error)
    }

    // Fetch from ONE
    let oneNewsAdded = false;
    try {
      const feed = await parser.parseURL(RSS_FEEDS.one)
      const items = feed.items.slice(0, 7).map(item => ({
        title: item.title || '',
        link: item.link || '',
        source: 'ONE'
      }))
      newsItems.push(...items)
      oneNewsAdded = items.length > 0;
    } catch (error) {
      console.error('Error fetching from ONE:', error)
    }
    // אם לא נוספו חדשות ONE, ננסה rss2json
    if (!oneNewsAdded) {
      try {
        const oneResponse = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://www.one.co.il/rss/");
        const oneData = await oneResponse.json();
        const oneNewsItems = (oneData.items || []).slice(0, 7).map(item => ({
          title: item.title || '',
          link: item.link || '',
          source: 'ONE'
        }));
        newsItems.push(...oneNewsItems);
      } catch (err) {
        console.error('Error fetching ONE from rss2json:', err);
      }
    }

    // Fetch from Globes
    try {
      const feed = await parser.parseURL(RSS_FEEDS.globes)
      const items = feed.items.slice(0, 7).map(item => ({
        title: item.title || '',
        link: item.link || '',
        source: 'גלובס'
      }))
      newsItems.push(...items)
    } catch (error) {
      console.error('Error fetching from Globes:', error)
    }

    // Shuffle the news items
    const shuffledNews = newsItems
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)

    return NextResponse.json(shuffledNews)
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
} 