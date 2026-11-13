# Copia los iconos de alimentos de la app (entre /*ICO_START*/ y /*ICO_END*/) a icons.js
import os
app=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','primeros-alimentos','index.html')
s=open(app,encoding='utf-8').read();i=s.index('/*ICO_START*/');j=s.index('/*ICO_END*/')
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'icons.js'),'w',encoding='utf-8').write('/* Iconos de alimentos de la app (generado por build_icons.py) */\n(function(){const ALL=[];\n'+s[i:j]+'\nwindow.foodIco=n=>{try{return ico(n)}catch(e){return ""}};window.foodIcoHas=n=>!!ICOS[n]})();\n')
print('ok')
