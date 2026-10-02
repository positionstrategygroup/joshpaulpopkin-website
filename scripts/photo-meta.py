# Embed identity metadata (EXIF + XMP) in a JPEG so the file itself says who is pictured.
#   python3 scripts/photo-meta.py IMG.jpg "Title" "Description" "kw1, kw2, ..."
import sys
from PIL import Image
from xml.sax.saxutils import escape as e
src, title, desc, kws = sys.argv[1:5]
keywords = [k.strip() for k in kws.split(',') if k.strip()]
creator = 'Josh Popkin (Josh Paul Popkin)'
im = Image.open(src)
ex = im.getexif()
ex[0x010E] = desc                      # ImageDescription
ex[0x013B] = creator                   # Artist
ex[0x8298] = 'Copyright (c) 2026 Josh Paul Popkin' # Copyright
ucs = lambda s: (s + '\0').encode('utf-16-le')
ex[0x9C9B] = ucs(title)                # XPTitle
ex[0x9C9C] = ucs(desc)                 # XPComment
ex[0x9C9D] = ucs(creator)              # XPAuthor
ex[0x9C9F] = ucs(title)                # XPSubject
ex[0x9C9E] = ucs(';'.join(keywords))   # XPKeywords
bag = ''.join(f'<rdf:li>{e(k)}</rdf:li>' for k in keywords)
xmp = f'''<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/">
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">{e(title)}</rdf:li></rdf:Alt></dc:title>
<dc:description><rdf:Alt><rdf:li xml:lang="x-default">{e(desc)}</rdf:li></rdf:Alt></dc:description>
<dc:creator><rdf:Seq><rdf:li>{e(creator)}</rdf:li></rdf:Seq></dc:creator>
<dc:subject><rdf:Bag>{bag}</rdf:Bag></dc:subject>
<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">© 2026 Josh Paul Popkin</rdf:li></rdf:Alt></dc:rights>
<photoshop:Headline>{e(title)}</photoshop:Headline>
<photoshop:Credit>Josh Popkin</photoshop:Credit>
<photoshop:Source>joshpaulpopkin.com</photoshop:Source>
<photoshop:City>New York</photoshop:City><photoshop:Country>United States</photoshop:Country>
<xmpRights:WebStatement>https://www.joshpaulpopkin.com/</xmpRights:WebStatement>
<Iptc4xmpCore:CreatorContactInfo rdf:parseType="Resource"><Iptc4xmpCore:CiUrlWork>https://www.joshpaulpopkin.com/</Iptc4xmpCore:CiUrlWork></Iptc4xmpCore:CreatorContactInfo>
<Iptc4xmpExt:PersonInImage><rdf:Bag><rdf:li>Josh Popkin</rdf:li><rdf:li>Josh Paul Popkin</rdf:li></rdf:Bag></Iptc4xmpExt:PersonInImage>
<plus:Licensor><rdf:Seq><rdf:li rdf:parseType="Resource"><plus:LicensorName>Josh Paul Popkin</plus:LicensorName><plus:LicensorURL>https://www.joshpaulpopkin.com/</plus:LicensorURL></rdf:li></rdf:Seq></plus:Licensor>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>'''
im.save(src, quality=92, optimize=True, progressive=True, exif=ex.tobytes(), xmp=xmp.encode('utf-8'))
print(src, 'metadata written')
