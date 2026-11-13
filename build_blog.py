# Genera blog.json con los artículos publicados y los borradores de la web.
import os,re,json,sys
web=sys.argv[1] if len(sys.argv)>1 else '../primerosalimentos-web'
out={'publicados':[],'borradores':[]}
for kind,base in [('publicados','blog'),('borradores','borradores')]:
    for d in sorted(os.listdir(os.path.join(web,base))):
        f=os.path.join(web,base,d,'index.html')
        if not os.path.isfile(f):continue
        s=open(f).read()
        t=re.search(r'<title>(.*?)</title>',s,re.S);t=t.group(1).split('|')[0].split(' · ')[0].strip() if t else d
        dt=re.search(r'"datePublished":\s*"([^"]+)"',s)
        out[kind].append({'slug':d,'t':t,'url':f'https://www.primerosalimentos.com/{base}/{d}/','d':dt.group(1)[:10] if dt else ''})
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'blog.json'),'w'),ensure_ascii=False,indent=1)
print(len(out['publicados']),'publicados,',len(out['borradores']),'borradores')
