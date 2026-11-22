import asyncio
from playwright.async_api import async_playwright
B='http://localhost:8766/tools/'
OUT='/home/claude/hero/'
TEXT={'textarea':'Send the monthly vendor report','input':'Jordan'}
async def walk(page, pick=0, maxsteps=9):
    for _ in range(maxsteps):
        if await page.locator('#planner-result .brief').count(): return True
        f=page.locator('#planner-form')
        for i in range(await f.locator('fieldset').count()):
            fs=f.locator('fieldset').nth(i)
            r=fs.locator('input[type=radio]')
            if await r.count(): await r.nth(min(pick,await r.count()-1)).check()
        for sel,val in [('textarea',TEXT['textarea']),('input[type=text]',TEXT['input'])]:
            loc=f.locator(sel)
            for i in range(await loc.count()):
                e=loc.nth(i)
                if await e.is_visible() and not (await e.input_value()): await e.fill(val)
        await page.click('#planner-next'); await page.wait_for_timeout(200)
    return await page.locator('#planner-result .brief').count()>0
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':1100,'height':1000},device_scale_factor=2,accept_downloads=True)
        pg=await ctx.new_page()
        # 1 Managing or Leading: shareable image with a varied sample
        await pg.goto(B+'managing-or-leading-check/index.html')
        import random; rnd=random.Random(3)
        for _ in range(6):
            if await pg.locator('#planner-result .brief').count(): break
            f=pg.locator('#planner-form')
            for i in range(await f.locator('fieldset').count()):
                r=f.locator('fieldset').nth(i).locator('input[type=radio]')
                if await r.count(): await r.nth(rnd.randrange(min(3,await r.count()))).check()
            await pg.click('#planner-next'); await pg.wait_for_timeout(150)
        await pg.click('.lean-save button'); await pg.wait_for_selector('#picture-dialog[open]')
        async with pg.expect_download() as d: await pg.click('#picture-save')
        await (await d.value).save_as(OUT+'lean.png')
        # 2 Delegation Planner brief
        await pg.goto(B+'delegation-planner/index.html')
        ok=await walk(pg, pick=1); print('delegation', ok)
        if ok: await pg.locator('#planner-result .brief').screenshot(path=OUT+'delegation-brief.png')
        # 3 Emotion Wheel step 1 wheel
        await pg.goto(B+'emotion-wheel/index.html'); await pg.wait_for_timeout(400)
        svg=pg.locator('#planner-form svg').first
        print('wheel', await svg.count())
        if await svg.count(): await svg.screenshot(path=OUT+'wheel.png')
        # 4 Eisenhower board
        await pg.goto(B+'eisenhower-matrix/index.html')
        await pg.fill('#task-input','Finish the budget draft\nPlan next quarter\nWeekly status report\nReorganize the shared drive\nPrepare the training agenda\nRespond to the audit request')
        await pg.click('#add-form button[type=submit]'); await pg.wait_for_timeout(300)
        zones=['do','schedule','delegate','reconsider','schedule','do']
        sels=pg.locator('#inbox select')
        for z in zones:
            s=pg.locator('#inbox select').first
            if not await s.count(): break
            await s.select_option(z); await pg.wait_for_timeout(150)
        await pg.locator('#board').screenshot(path=OUT+'eisenhower.png')
        await b.close()
asyncio.run(main())
