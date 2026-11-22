import asyncio
from playwright.async_api import async_playwright
B='http://localhost:8766/tools/'; OUT='/home/claude/hero/'
VAL={'task':'Send the monthly vendor report','person':'Jordan','done':'The report goes to the finance team by the 5th, with totals checked against invoices.',
     'why':'Finance uses it to plan the next month.','schedule':'Monthly, by the 5th'}
EXTRA=['The report goes out by the 5th','Totals match the invoices','Finance has no follow-up questions']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':1100,'height':1000},device_scale_factor=2)
        pg=await ctx.new_page()
        await pg.goto(B+'delegation-planner/index.html')
        k=0; extra=list(EXTRA)
        for _ in range(9):
            if await pg.locator('#planner-result .brief').count(): break
            f=pg.locator('#planner-form')
            fss=f.locator('fieldset')
            for i in range(await fss.count()):
                r=fss.nth(i).locator('input[type=radio]')
                n=await r.count()
                if n: await r.nth(k % min(n,3) if n>=3 else 0).check(); k+=1
            for sel in ['textarea','input[type=text]']:
                loc=f.locator(sel)
                for i in range(await loc.count()):
                    e=loc.nth(i)
                    if not await e.is_visible() or await e.input_value(): continue
                    fid=await e.get_attribute('id') or ''
                    v=next((VAL[x] for x in VAL if fid.endswith(x) or fid==x), None)
                    if v is None: v=extra.pop(0) if extra else 'Finance has what it needs'
                    await e.fill(v)
            await pg.click('#planner-next'); await pg.wait_for_timeout(200)
        await pg.add_style_tag(content='.brief-edit{display:none!important}')
        brief=pg.locator('#planner-result .brief')
        await brief.screenshot(path=OUT+'delegation-full.png')
        rel=await pg.evaluate('''(()=>{const b=document.querySelector('#planner-result .brief').getBoundingClientRect();const s=[...document.querySelectorAll('#planner-result .brief-section')].find(x=>x.textContent.includes('Who decides what')).getBoundingClientRect();return [s.bottom-b.top, b.height]})()''')
        from PIL import Image
        im=Image.open(OUT+'delegation-full.png'); sc=im.height/rel[1]
        im.crop((0,0,im.width,int((rel[0]+28)*sc))).save(OUT+'delegation.png')
        await b.close(); return
        # Eisenhower in screenshot view
        await pg.goto(B+'eisenhower-matrix/index.html')
        await pg.fill('#task-input','Finish the budget draft\nPlan next quarter\nWeekly status report\nReorganize the shared drive\nPrepare the training agenda\nRespond to the audit request')
        await pg.click('#add-form button[type=submit]'); await pg.wait_for_timeout(300)
        for z in ['do','schedule','delegate','reconsider','schedule','do']:
            await pg.locator('#inbox select').first.select_option(z); await pg.wait_for_timeout(120)
        await pg.click('#capture'); await pg.click('#screenshot-view'); await pg.wait_for_timeout(300)
        await pg.locator('#board').screenshot(path=OUT+'eisenhower.png')
        await b.close()
asyncio.run(main())
