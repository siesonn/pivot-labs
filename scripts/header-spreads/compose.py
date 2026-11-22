from PIL import Image, ImageDraw, ImageFilter
import sys, os
R='/home/claude/pivot-labs/'
W,H=1400,800
IVORY=(255,253,247,255); EDGE=(202,188,177,255)
def paper(im, pad=0, radius=10):
    im=im.convert('RGBA')
    w,h=im.size[0]+2*pad, im.size[1]+2*pad
    card=Image.new('RGBA',(w,h),(0,0,0,0))
    mask=Image.new('L',(w,h),0); ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius,fill=255)
    base=Image.new('RGBA',(w,h),IVORY); base.paste(im,(pad,pad),im)
    card.paste(base,(0,0),mask)
    ImageDraw.Draw(card).rounded_rectangle((0,0,w-1,h-1),radius,outline=EDGE,width=2)
    return card
def place(canvas, card, cx, cy, rot):
    c=card.rotate(rot, resample=Image.BICUBIC, expand=True)
    sh=Image.new('RGBA',c.size,(0,0,0,0)); a=c.split()[3].point(lambda v: int(v*0.45))
    sh.putalpha(a); sh=Image.composite(Image.new('RGBA',c.size,(10,18,32,255)),Image.new('RGBA',c.size,(0,0,0,0)),a)
    sh=sh.filter(ImageFilter.GaussianBlur(14))
    x=int(cx-c.width/2); y=int(cy-c.height/2)
    canvas.alpha_composite(sh,(x+6,y+14)); canvas.alpha_composite(c,(x,y))
def fit(im,h=None,w=None):
    if h: return im.resize((int(im.width*h/im.height),h),Image.LANCZOS)
    return im.resize((w,int(im.height*w/im.width)),Image.LANCZOS)
# Guides spread
g=Image.new('RGBA',(W,H),(0,0,0,0))
names=['find-the-real-cause','who-decides-what','johari-window','coach-share-or-direct','urgent-vs-important']
spots=[(250,420,10),(1150,420,-10),(470,395,5),(930,395,-5),(700,385,0)]
for n,(cx,cy,r) in zip(names,spots):
    im=Image.open(f'{R}guides/{n}/{n}-share.png'); place(g, paper(fit(im,h=600)), cx, cy, r)
g.save('guides-spread.png')
# Tools spread
t=Image.new('RGBA',(W,H),(0,0,0,0))
place(t, paper(fit(Image.open('wheel.png'),w=400), pad=16), 1150, 300, -7)
place(t, paper(fit(Image.open('delegation.png'),h=600), ), 300, 390, 5)
place(t, paper(fit(Image.open('eisenhower.png'),w=560), pad=12), 1040, 612, 3)
place(t, paper(fit(Image.open('lean.png'),w=440)), 740, 320, -3)
t.save('tools-spread.png')
for n in ['guides-spread','tools-spread']:
    im=Image.open(n+'.png'); bb=im.getbbox(); print(n,bb)
