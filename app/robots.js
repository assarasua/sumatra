import trainingCrawlers from '../lib/training-crawlers.json' with {type:'json'};
export default function robots(){return {rules:[{userAgent:'*',allow:'/',disallow:['/api/','/payment/']},{userAgent:trainingCrawlers,disallow:'/'}],sitemap:'https://www.exploresumatraescape.com/sitemap.xml'};}
