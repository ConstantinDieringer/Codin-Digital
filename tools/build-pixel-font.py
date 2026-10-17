"""Build the original, local Codin Pixel bitmap typeface using Python's stdlib."""
from pathlib import Path
import struct
import json

# Connected edge-neighbours, rounded exposed corners and proportional ink widths.
# Row four is the common writing line; descenders may continue below it.
UPPER = {
'A':'01110 10001 11111 10001 10001', 'B':'11110 10001 11110 10001 11110',
'C':'0111 1000 1000 1000 0111', 'D':'1110 1001 1001 1001 1110',
'E':'1111 1000 1110 1000 1111', 'F':'1111 1000 1110 1000 1000',
'G':'0111 1000 1011 1001 0111', 'H':'1001 1001 1111 1001 1001',
'I':'111 010 010 010 111', 'J':'0111 0010 0010 1010 1110',
'K':'1001 1010 1100 1010 1001', 'L':'1000 1000 1000 1000 1111',
'M':'10001 11011 10101 10001 10001', 'N':'1001 1101 1011 1001 1001',
'O':'0110 1001 1001 1001 0110', 'P':'1111 1001 1111 1000 1000',
'Q':'1111 1001 1001 1011 1111', 'R':'1111 1001 1111 1010 1001',
'S':'1111 1000 1111 0001 1111', 'T':'11111 00100 00100 00100 00100',
'U':'1001 1001 1001 1001 1111', 'V':'10001 10001 10001 01010 00100',
'W':'10001 10001 10101 11011 10001', 'X':'10001 01010 00100 01010 10001',
'Y':'10001 01010 00100 00100 00100', 'Z':'1111 0001 0110 1000 1111',
}
LOWER = {
'a':'0110 0001 0111 1001 0110', 'b':'1000 1000 1111 1001 1111',
'c':'0000 0111 1000 1000 0111', 'd':'0001 0001 0111 1001 0111',
'e':'1111 1001 1111 1000 1111', 'f':'011 010 111 010 010',
'g':'0000 0110 1001 1001 0111 1001 0110', 'h':'1000 1000 1111 1001 1001',
'i':'1 0 1 1 1', 'j':'01 00 01 01 11',
'k':'100 101 110 101 101', 'l':'10 10 10 10 11',
'm':'00000 11111 10101 10101 10101', 'n':'0000 1110 1001 1001 1001',
'o':'0000 0110 1001 1001 0110', 'p':'1111 1001 1111 1000 1000',
'q':'1111 1001 1111 0001 0001', 'r':'000 111 100 100 100',
's':'0000 1111 1100 0011 1111', 't':'010 111 010 010 011',
'u':'0000 1001 1001 1001 1111', 'v':'00000 10001 10001 01010 00100',
'w':'00000 10001 10101 11011 10001', 'x':'000 101 010 101 101',
'y':'1001 1001 1111 0001 1111', 'z':'000 111 001 100 111',
}
DIGITS = dict(zip('0123456789', [
'1111 1001 1001 1001 1111', '01 11 01 01 01',
'1111 0001 1111 1000 1111', '1111 0001 0111 0001 1111',
'1001 1001 1111 0001 0001', '1111 1000 1111 0001 1111',
'1111 1000 1111 1001 1111', '1111 0001 0010 0100 0100',
'1111 1001 1111 1001 1111', '1111 1001 1111 0001 1111',
]))
PATTERNS = {**UPPER, **LOWER, **DIGITS,
'-':'000 000 111 000 000', '_':'000 000 000 000 111',
'.':'0 0 0 0 1', ' ':'00 00 00 00 00',
',':'0 0 0 0 1 1', '!':'1 1 1 0 1', '?':'1110 0001 0110 0000 0100',
'/':'0001 0010 0010 0100 1000',
'ä':'1001 0110 0001 1111 1001', 'ö':'1001 0110 1001 1001 0110',
'ü':'1001 0000 1001 1001 0111', 'ß':'0110 1001 1110 1001 1010'}
pack = struct.pack

def glyph(pattern):
    rows = pattern.split()
    occupied = [x for row in rows for x, bit in enumerate(row) if bit == '1']
    if not occupied: return b'', 0, 0, 270
    first, last = min(occupied), max(occupied)
    rows = [row[first:last+1] for row in rows]
    width = last-first+1
    def filled(x, y):
        return 0 <= y < len(rows) and 0 <= x < width and rows[y][x] == '1'
    points, flags, ends = [], [], []
    def point(x,y,on=True):
        points.append((x,y)); flags.append(int(on))
    for row, bits in enumerate(rows):
        for col, bit in enumerate(bits):
            if bit != '1': continue
            x, y = col * 100, (4-row) * 100 + 100
            top, right = filled(col,row-1), filled(col+1,row)
            bottom, left = filled(col,row+1), filled(col-1,row)
            tl = 17 if not top and not left else 0
            tr = 17 if not top and not right else 0
            br = 17 if not bottom and not right else 0
            bl = 17 if not bottom and not left else 0
            point(x+tl,y+100)
            point(x+100-tr,y+100)
            if tr: point(x+100,y+100,False); point(x+100,y+100-tr)
            point(x+100,y+br)
            if br: point(x+100,y,False); point(x+100-br,y)
            point(x+bl,y)
            if bl: point(x,y,False); point(x,y+bl)
            point(x,y+100-tl)
            if tl: point(x,y+100,False)
            ends.append(len(points)-1)
    xs, ys = zip(*points)
    data = pack('>hhhhh', len(ends), min(xs), min(ys), max(xs), max(ys))
    data += pack('>'+'H'*len(ends), *ends) + pack('>H', 0) + bytes(flags)
    data += pack('>'+'h'*len(points), *[v-(xs[i-1] if i else 0) for i,v in enumerate(xs)])
    data += pack('>'+'h'*len(points), *[v-(ys[i-1] if i else 0) for i,v in enumerate(ys)])
    return data + b'\0'*(-len(data)%4), len(points), len(ends), width*100+70

chars = sorted(PATTERNS)
patterns = ['1111 1001 1001 1001 1111'] + [PATTERNS[c] for c in chars]
glyf, offsets, advances, maxpoints, maxcontours = b'', [], [], 0, 0
for pattern in patterns:
    offsets.append(len(glyf))
    data, points, contours, advance = glyph(pattern)
    advances.append(advance)
    glyf += data
    maxpoints, maxcontours = max(maxpoints, points), max(maxcontours, contours)
offsets.append(len(glyf))
count = len(patterns)
minimum_y = min((5-row)*100 for pattern in patterns for row,bits in enumerate(pattern.split()) if '1' in bits)
head = pack('>IIIIHHQQhhhhHHhhh', 0x10000, 0x10000, 0, 0x5f0f3cf5, 3, 1000, 0, 0, 0, minimum_y, 500, 600, 0, 8, 2, 1, 0)
hhea = pack('>IhhhH', 0x10000, 800, -200, 0, max(advances)) + pack('>11hH', 0, 70, 500, 1, 0, 0, 0, 0, 0, 0, 0, count)
maxp = pack('>IH13H', 0x10000, count, maxpoints, maxcontours, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0)
os2 = pack('>HhHHH11h', 0, round(sum(advances)/len(advances)), 400, 5, 0, 650, 600, 0, 100, 650, 600, 0, 350, 70, 300, 0)
os2 += bytes([2,11,5,3,0,0,0,0,0,0]) + pack('>4I',3,0,0,0) + b'CDIN'
os2 += pack('>HHHhhhHH', 0x40, ord(chars[0]), ord(chars[-1]), 800, -200, 0, 800, 200)
# Unicode format 12 mapping, supported by modern desktop and mobile browsers.
sub = pack('>HHIII', 12, 0, 16+12*len(chars), 0, len(chars))
sub += b''.join(pack('>III', ord(c), ord(c), i+1) for i,c in enumerate(chars))
cmap = pack('>HHHHI', 0, 1, 3, 10, 12) + sub
names = {1:'Codin Pixel', 2:'Regular', 3:'CodinPixel-Regular-4.0', 4:'Codin Pixel Regular', 5:'Version 4.0', 6:'CodinPixel-Regular'}
records, strings = b'', b''
for key, value in names.items():
    text = value.encode('utf-16-be')
    records += pack('>6H',3,1,0x409,key,len(text),len(strings))
    strings += text
name = pack('>3H',0,len(names),6+12*len(names)) + records + strings
tables = {'head':head,'hhea':hhea,'maxp':maxp,'OS/2':os2,'cmap':cmap,'glyf':glyf,
'loca':pack('>'+'I'*len(offsets),*offsets),'hmtx':b''.join(pack('>Hh',advance,0) for advance in advances),
'name':name,'post':pack('>IihhIIIII',0x30000,0,-100,50,0,0,0,0,0)}

def checksum(data):
    data += b'\0'*(-len(data)%4)
    return sum(struct.unpack('>'+'I'*(len(data)//4),data)) & 0xffffffff

n = len(tables)
power = 2**(n.bit_length()-1)
font = pack('>IHHHH',0x10000,n,power*16,power.bit_length()-1,n*16-power*16)
directory, payload = b'', b''
head_offset = 0
for tag,data in sorted(tables.items()):
    offset = 12+16*n+len(payload)
    if tag == 'head': head_offset = offset
    directory += tag.encode('ascii')+pack('>III',checksum(data),offset,len(data))
    payload += data + b'\0'*(-len(data)%4)
font = bytearray(font+directory+payload)
font[head_offset+8:head_offset+12] = pack('>I',(0xb1b0afba-checksum(bytes(font)))&0xffffffff)
assert checksum(bytes(font)) == 0xb1b0afba
out = Path(__file__).resolve().parents[1] / 'fonts' / 'codin-pixel.ttf'
out.write_bytes(font)
print(f'Built {out.name}: {count} glyphs, {len(font)} bytes')

# Keep closed counters forbidden even when rounded diagonal pixels leave tiny
# raster gaps. Their topology comes from the same grid that builds the font.
metadata = {}
for char, pattern in PATTERNS.items():
    rows = pattern.split()
    occupied = [x for row in rows for x, bit in enumerate(row) if bit == '1']
    if not occupied:
        metadata[char] = {'rows': rows, 'counters': []}
        continue
    first, last = min(occupied), max(occupied)
    rows = [row[first:last+1] for row in rows]
    width = len(rows[0])
    height = len(rows)
    reachable, pending = set(), []
    for y in range(height):
        for x in range(width):
            if (x in (0,width-1) or y in (0,height-1)) and rows[y][x]=='0':
                reachable.add((x,y)); pending.append((x,y))
    while pending:
        x,y = pending.pop()
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<width and 0<=ny<height and rows[ny][nx]=='0' and (nx,ny) not in reachable:
                reachable.add((nx,ny)); pending.append((nx,ny))
    counters = [[x,y] for y in range(height) for x in range(width) if rows[y][x]=='0' and (x,y) not in reachable]
    metadata[char] = {'rows': rows, 'counters': counters}
out.with_name('codin-glyphs.js').write_text('window.CODIN_GLYPHS = '+json.dumps(metadata,separators=(',',':'))+';\n')
