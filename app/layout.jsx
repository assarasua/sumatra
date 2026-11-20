import {Instrument_Sans,Instrument_Serif,IBM_Plex_Mono} from 'next/font/google';
import './globals.css';
import {siteIdentity} from '../lib/site-identity.js';
const sans=Instrument_Sans({subsets:['latin'],variable:'--sans',display:'swap'});
const serif=Instrument_Serif({subsets:['latin'],weight:'400',style:['normal','italic'],variable:'--serif',display:'swap'});
const mono=IBM_Plex_Mono({subsets:['latin'],weight:['400','500'],variable:'--mono',display:'swap'});
export const metadata={metadataBase:new URL('https://www.exploresumatraescape.com'),title:{default:'Explore Sumatra Escape — Bukit Lawang orangutan treks',template:'%s | Explore Sumatra Escape'},description:'Guided jungle treks in Bukit Lawang and custom Sumatra journeys.',icons:{icon:'/assets/mark.svg'}};
export default function Layout({children}){return <html lang="en"><body className={`${sans.variable} ${serif.variable} ${mono.variable}`}>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(siteIdentity).replace(/</g,'\\u003c')}}/></body></html>}
