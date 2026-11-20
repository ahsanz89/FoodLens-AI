import asyncio
from playwright.async_api import async_playwright
G="#2E8B57"
def card(e,t,s,pct=None,col=G):
    p=f'<div class="pct" style="background:{col}">{pct}%</div>' if pct else ''
    return f'<div class="rc"><div class="em">{e}</div><div class="rt"><b>{t}</b><span>{s}</span></div>{p}</div>'
def chip(e,t,on=True): return f'<span class="chip {"on" if on else ""}">{e} {t}</span>'
SCREENS={
"home":f'''<div class="hd"><small>Good evening 👋</small><h2>What's in your kitchen?</h2></div>
<div class="cta">📷 Scan Ingredients</div>
<div class="sec">Recommended for you</div>
{card("🍝","Garlic Tomato Pasta","20 min · Easy","96")}{card("🍳","Shakshuka","25 min · Easy","88")}{card("🍛","Chicken Karahi","40 min · Medium","74","#E8A317")}
<div class="sec">Daily inspiration</div>{card("🥞","Fluffy Pancakes","15 min · Easy")}''',
"scan":f'''<div class="cam"><div class="frame"></div><div class="tag t1">🍅 Tomato</div><div class="tag t2">🧄 Garlic</div><div class="tag t3">🧅 Onion</div><div class="tag t4">🥚 Eggs</div><div class="big">🥘</div><div class="hint">Point at your ingredients</div><div class="shut"></div></div>''',
"detected":f'''<div class="hd"><small>AI found 6 ingredients</small><h2>Confirm your list</h2></div>
<div class="chips">{chip("🍅","Tomato")}{chip("🧄","Garlic")}{chip("🧅","Onion")}{chip("🥚","Eggs")}{chip("🌶️","Chili")}{chip("🫒","Olive oil")}{chip("🧀","Cheese",False)}</div>
<div class="note">Tap to remove or add. You are always in control.</div><div class="cta">Find recipes →</div>''',
"results":f'''<div class="hd"><small>Based on your 6 ingredients</small><h2>You can cook now</h2></div>
<div class="chips">{chip("","All")}{chip("","Vegetarian",False)}{chip("","Under 30 min",False)}</div>
{card("🍳","Shakshuka","Missing: feta","92")}{card("🍝","Garlic Tomato Pasta","Ready to cook","100")}{card("🍚","Egg Fried Rice","Missing: rice","81","#E8A317")}{card("🥗","Greek Salad","Missing: 2","67","#E8A317")}''',
"recipe":f'''<div class="hero">🍝</div><div class="hd" style="margin-top:-6px"><h2>Garlic Tomato Pasta</h2><small>⏱ 20 min · 🍽 2 servings · 🔥 Easy</small></div>
<div class="sec">Ingredients</div><div class="chips">{chip("✓","Pasta")}{chip("✓","Tomato")}{chip("✓","Garlic")}{chip("✓","Olive oil")}</div>
<div class="cta">▶ Start cooking mode</div>''',
"cook":f'''<div class="hd"><small>Step 2 of 5 · ⏱ 04:30</small><h2>Sauté the garlic</h2></div><div class="rc" style="padding:34px 20px"><div class="em">🧄</div><div class="rt"><b style="font-size:24px">Add garlic and olive oil</b><span style="font-size:18px">Cook gently until golden, about 1 minute.</span></div></div><div class="chips">{chip("✓","Boil pasta")}{chip("●","Sauté garlic")}{chip("","Add tomato",False)}{chip("","Toss",False)}</div><div class="cta">Next step →</div>''',
"favs":f'''<div class="hd"><small>Saved by you</small><h2>Favorites</h2></div>{card("🍝","Garlic Tomato Pasta","Dinner · 20 min")}{card("🍛","Chana Masala","Vegan · 35 min")}{card("🥗","Greek Salad","Light · 10 min")}{card("🍲","Red Lentil Soup","Comfort · 30 min")}''',
"profile":f'''<div class="hd"><small>Your taste, your rules</small><h2>Preferences</h2></div><div class="sec">Diet</div><div class="chips">{chip("🥦","Vegetarian")}{chip("🌱","Vegan",False)}{chip("🕌","Halal")}{chip("🌾","Gluten-free",False)}</div><div class="sec">Allergies</div><div class="chips">{chip("🥜","Peanuts")}{chip("🥛","Dairy",False)}{chip("🥚","Eggs",False)}</div><div class="note">Allergen filtering is a helper. Always check labels.</div><div class="cta">Save preferences</div>''',
"kitchen":f'''<div class="hd"><small>Never forget what you have</small><h2>My Kitchen</h2></div>
<div class="chips">{chip("🍅","Tomato")}{chip("🧄","Garlic")}{chip("🥛","Milk")}{chip("🍚","Rice")}{chip("🥔","Potato")}</div>
<div class="sec">Shopping list</div>
{card("🧀","Feta cheese","For Shakshuka")}{card("🍚","Basmati rice","For Egg Fried Rice")}''',
}
HEAD={"home":("Cook with what","you already have"),"scan":("Point. Scan.","Know instantly."),"detected":("AI spots your","ingredients"),"results":("Recipes ranked","by match %"),"recipe":("Step-by-step","cooking mode"),"kitchen":("Plan smarter,","waste less"),"cook":("Hands-free","cooking mode"),"favs":("Save the recipes","you love"),"profile":("Made for your","diet & allergies")}
EM={"home":"🍅🥑🍋","scan":"🥕🌶️🍄","detected":"🥦🧄🍆","results":"🥚🧀🌿","recipe":"🍝🍅🧄","kitchen":"🥛🍞🍎","cook":"🧄🫒🍅","favs":"❤️🍝🥗","profile":"🌱🥜🕌"}
CSS="""
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;overflow:hidden;font-family:Poppins,Inter,sans-serif;
background:radial-gradient(1200px 900px at 20% 10%,var(--a),transparent 60%),radial-gradient(1000px 900px at 90% 85%,var(--b),transparent 60%),linear-gradient(160deg,#052e1b,#0b4d2e 55%,#06281a);position:relative;color:#fff}
.glow{position:absolute;width:900px;height:900px;border-radius:50%;filter:blur(120px);opacity:.55;left:90px;top:760px;background:var(--g)}
h1{position:absolute;top:120px;left:80px;right:80px;font-size:104px;line-height:1.02;font-weight:800;letter-spacing:-3px}
h1 span{background:linear-gradient(90deg,#9dffc6,#ffe27a);-webkit-background-clip:text;color:transparent}
.logo{position:absolute;top:56px;left:80px;font-size:30px;font-weight:600;opacity:.85;letter-spacing:1px}
.stage{position:absolute;left:0;right:0;top:420px;height:1400px;perspective:2400px}
.phone{position:absolute;left:300px;top:60px;width:500px;height:1040px;transform:rotateY(-24deg) rotateX(9deg) rotateZ(4deg);transform-style:preserve-3d;
border-radius:78px;background:linear-gradient(145deg,#2a2f2c,#050605);padding:16px;
box-shadow:-18px 22px 0 -2px #0a0c0b,-30px 40px 0 -4px #101311,-60px 90px 120px rgba(0,0,0,.65),inset 0 0 0 3px #5a625d}
.scr{width:100%;height:100%;border-radius:62px;background:#FAFAF7;overflow:hidden;position:relative;color:#16211b;padding:64px 26px 20px}
.scr:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.35),transparent 35%);pointer-events:none}
.tabs{position:absolute;left:0;right:0;bottom:0;height:96px;background:#fff;border-top:1px solid #e3ece6;display:flex;justify-content:space-around;align-items:center;font-size:30px;z-index:2}.tabs i{font-style:normal;font-size:13px;display:block;text-align:center;color:#667;font-family:Poppins}.tabs div{text-align:center}.notch{position:absolute;top:18px;left:50%;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:#050605;z-index:3}
.hd small{font-size:17px;color:#5d6d64}.hd h2{font-size:38px;line-height:1.1;margin:4px 0 16px;letter-spacing:-1px}
.cta{background:#2E8B57;color:#fff;text-align:center;padding:26px;border-radius:20px;font-weight:700;font-size:21px;margin:14px 0;box-shadow:0 10px 22px rgba(46,139,87,.4)}
.sec{font-weight:700;font-size:21px;margin:16px 0 10px}
.rc{display:flex;align-items:center;gap:14px;background:#fff;border-radius:22px;padding:22px 16px;margin-bottom:20px;box-shadow:0 8px 20px rgba(20,40,30,.12)}
.em{font-size:46px;width:72px;height:72px;border-radius:18px;background:#E9F6EE;display:flex;align-items:center;justify-content:center}
.rt{flex:1}.rt b{display:block;font-size:20px}.rt span{font-size:15px;color:#667}
.pct{color:#fff;font-weight:800;font-size:18px;padding:8px 12px;border-radius:14px}
.chips{display:flex;flex-wrap:wrap;gap:10px}.chip{padding:10px 16px;border-radius:30px;background:#E9F6EE;font-size:19px;font-weight:600;border:2px solid #cfe9da}
.chip.on{background:#2E8B57;color:#fff;border-color:#2E8B57}.note{font-size:16px;color:#667;margin:18px 0}
.cam{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,#5a4636,#1d1510 70%)}.big{position:absolute;top:36%;left:0;right:0;text-align:center;font-size:230px;filter:drop-shadow(0 20px 20px #000a)}
.frame{position:absolute;inset:150px 40px 260px;border:4px solid #9dffc6;border-radius:34px;box-shadow:0 0 40px #9dffc688}
.tag{position:absolute;background:#2E8B57;color:#fff;padding:9px 15px;border-radius:30px;font-size:19px;font-weight:700;box-shadow:0 8px 16px #0008}
.t1{top:200px;left:60px}.t2{top:330px;right:50px}.t3{top:600px;left:50px}.t4{top:690px;right:70px}
.hint{position:absolute;bottom:170px;width:100%;text-align:center;color:#fff;font-size:19px}.shut{position:absolute;bottom:60px;left:50%;margin-left:-40px;width:80px;height:80px;border-radius:50%;border:6px solid #fff;background:#2E8B57}
.hero{height:300px;margin:-64px -26px 0;background:linear-gradient(160deg,#ffb36b,#e8542f);display:flex;align-items:center;justify-content:center;font-size:190px}
.fl{position:absolute;font-size:120px;filter:drop-shadow(0 30px 25px rgba(0,0,0,.55));z-index:5}
.pill{position:absolute;left:80px;bottom:80px;font-size:30px;font-weight:600;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.3);padding:14px 28px;border-radius:40px;backdrop-filter:blur(8px)}
"""
THEMES=[("#1f8f5a","#c9791f","#2fbf7a"),("#2a6f9e","#1f8f5a","#3aa0d8"),("#7a3fa0","#1f8f5a","#b36be0"),("#c9791f","#1f6f4a","#ffb347"),("#b8452a","#1f8f5a","#ff7a50"),("#1f8f8f","#6a8f1f","#5fe0c8"),("#a03f6a","#c9791f","#ff6fa5"),("#3f55a0","#1f8f5a","#6f8bff"),("#1f8f5a","#a0841f","#7dffb0")]
def page(k,i):
    a,b,g=THEMES[i];h1,h2=HEAD[k];e=EM[k]
    fl=''.join(f'<div class="fl" style="left:{x}px;top:{y}px;font-size:{s}px;transform:rotate({r}deg);filter:drop-shadow(0 30px 25px rgba(0,0,0,.55)) blur({bl}px)">{ch}</div>' for ch,(x,y,s,r,bl) in zip(["".join(c) for c in e if True] if False else list(e) if False else [e[j:j+2] if e[j:j+2].isascii()==False else e[j] for j in range(0)] or [c for c in __import__('re').findall(r'[^️‍]️?',e)],[(40,640,170,-15,0),(800,520,130,20,0),(70,1330,150,12,5)]))
    cam='<div class="notch"></div>' 
    tabs='' if k=="scan" else '<div class="tabs"><div>🏠<i>Home</i></div><div>🔎<i>Discover</i></div><div>🧺<i>Kitchen</i></div><div>❤️<i>Saved</i></div><div>👤<i>Profile</i></div></div>'
    return f'<html><head><style>{CSS}:root{{--a:{a};--b:{b};--g:{g}}}</style></head><body><div class="glow"></div><div class="logo">🍽️ FOODLENS AI</div><h1>{h1}<br><span>{h2}</span></h1><div class="stage"><div class="phone"><div class="scr">{cam}{SCREENS[k]}{tabs}</div></div>{fl}</div></body></html>'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
        pg=await b.new_page(viewport={"width":1080,"height":1920})
        for i,k in enumerate(SCREENS):
            await pg.set_content(page(k,i));await pg.wait_for_timeout(400)
            await pg.screenshot(path=f"/home/claude/foodlens-repo/store/screenshots/{i+1:02d}_{k}.png")
        await b.close()
asyncio.run(main())
