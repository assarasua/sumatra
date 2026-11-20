"""Generate the branded tour PDFs from public/agent-catalog.json.
Run with reportlab and fonts in /tmp/sumatra-guide-fonts (Instrument Serif/Sans).
These static PDFs are committed; Cloudflare builds need no Python dependencies.
"""
import json,re
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Image,KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
for name,file in [('Serif','serif.ttf'),('Sans','sans-400.ttf'),('SansBold','sans-600.ttf')]:pdfmetrics.registerFont(TTFont(name,'/tmp/sumatra-guide-fonts/'+file))
paper=HexColor('#f6f0e4');green=HexColor('#1f4a3a');clay=HexColor('#9a3a20')
body=ParagraphStyle('Body',fontName='Sans',fontSize=10,leading=15,textColor=HexColor('#1a1d1c'),spaceAfter=8)
heading=ParagraphStyle('Heading',fontName='Serif',fontSize=25,leading=28,textColor=green,spaceBefore=18,spaceAfter=10,keepWithNext=True)
title=ParagraphStyle('Title',parent=heading,fontSize=40,leading=42,spaceAfter=24)
small=ParagraphStyle('Small',parent=body,fontSize=8.5,leading=12,textColor=clay)
sub=ParagraphStyle('Sub',parent=body,fontName='SansBold',spaceBefore=10,keepWithNext=True)
def p(s,style=body):return Paragraph(escape(s),style)
def footer(c,doc):
 c.saveState();c.setFillColor(paper);c.rect(0,0,595.28,841.89,fill=1,stroke=0)
 c.drawImage(str(ROOT/'public/assets/logo.png'),48,778,width=224,height=35.4,mask='auto')
 c.setStrokeColor(HexColor('#ded7c9'));c.line(48,61,547,61)
 c.setFont('Sans',8);c.setFillColor(green);c.drawString(48,43,'Explore Sumatra Escape · WhatsApp +34 615 788 239');c.drawRightString(547,43,str(doc.page));c.restoreState()
def bullet(s):return p('• '+s)
(ROOT/'public/guides').mkdir(exist_ok=True)
for t in json.loads((ROOT/'public/agent-catalog.json').read_text())['tours']:
 out=ROOT/'public/guides'/f"{t['id'].lower()}.pdf"
 story=[Spacer(1,15),p('YOUR TRAIL GUIDE · BUKIT LAWANG',small),p(t['title'],title)]
 im=Image(str(ROOT/'public/assets/photos'/t['photo']),width=499,height=300,kind='proportional');story+=[im,Spacer(1,24),p(f"{t['days']} {'day' if t['days']==1 else 'days'} · {str(t['nights'])+' nights' if t['nights']>1 else '1 night' if t['nights']==1 else 'Day trek'} · Local-guided rainforest trekking",heading),p('The jungle, at your own pace. A practical guide to your route, what to bring and the details to confirm with our team.'),p('Sandy, Asier & Nacho · A partnership born in Bukit Lawang',small),PageBreak()]
 story+=[p('Before your adventure',heading),p('Your preferred departure date, meeting point and final travel details are confirmed by our team. Contact us before arranging non-refundable onward travel.'),p('Talk to the team',heading),p('WhatsApp: +34 615 788 239'),Paragraph('<link href="https://wa.me/34615788239" color="#9a3a20">Open WhatsApp: wa.me/34615788239</link>',body),p('Include your booking reference and preferred date. Tell us about dietary needs, fitness, mobility requirements and arrival plans so we can discuss a suitable route.'),p('What to pack',heading)]
 story += [bullet(x) for x in t['packing']]
 story += [p('Our additional recommendations',sub),p('Use waterproof protection for your phone and spare clothes, bring a light rain layer and any personal medication, and keep your backpack comfortable to carry. Ask your guide about the conditions and any additional equipment for your dates.'),p('Wildlife on its own terms',heading),p('Sightings are never guaranteed. Keep a safe distance and follow your guide. Never feed, touch, chase, call or disturb wildlife. Carry out all waste and keep noise low. Paths and river activities adapt to weather and conditions.'),PageBreak(),p('Your itinerary',heading),p('The schedule below describes the supplied route. Times are approximate and may change with weather, river levels, wildlife movements and the group’s pace.',small)]
 for line in t['fullItinerary'].splitlines():
  if not line.strip():continue
  if re.match(r'DAY \d',line,re.I):story.append(p(line,heading))
  elif re.match(r'\d{1,2}:\d\d',line):story.append(p(line,sub))
  else:story.append(p(line))
 story += [PageBreak(),p('What your tour includes',heading)]+[bullet(x) for x in t['included']]
 story += [p('Outside the inclusions',heading)]+([bullet(x) for x in t['excluded']] if t['excluded'] else [p('Ask our team to confirm any services outside the inclusions listed above. The supplied specification does not list separate exclusions for this tour.')])
 story += [p('Important route notes',heading)]+[bullet(x) for x in t['important']]
 story += [p('Getting ready for Bukit Lawang',heading),p('Arrive with time to rest before your trek. Confirm your accommodation and transport arrangements separately where they are not included. Keep valuables and luggage you will not carry in a safe place agreed with your accommodation.'),p('Rain can fall throughout the year. Conditions change locally; ask us about trails and river levels for your dates. River tubing only operates when the guide considers the conditions suitable.'),p('exploresumatraescape.com · +34 615 788 239',small)]
 SimpleDocTemplate(str(out),pagesize=(595.28,841.89),leftMargin=48,rightMargin=48,topMargin=99,bottomMargin=84,title=t['title']+' · Tour Guide',author='Explore Sumatra Escape').build(story,onFirstPage=footer,onLaterPages=footer)
 print(out.name)
