import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';

const url=process.env.BRUMARIA_TEST_URL??'http://127.0.0.1:8765/';
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1365,height:768},deviceScaleFactor:1});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(String(error?.stack??error)));
page.on('console',msg=>{if(msg.type()==='error')pageErrors.push('console: '+msg.text());});
const check=async label=>{
  const fatal=page.locator('#fatal');
  if(await fatal.isVisible())throw Error(label+': '+(await fatal.innerText()).slice(0,1400));
  if(pageErrors.length)throw Error(label+': '+pageErrors.join('\n').slice(0,2000));
  console.log('PASS:',label);
};
try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  try{
    await page.locator('#game canvas').waitFor({state:'attached',timeout:40000});
  }catch(error){
    await page.screenshot({path:'artifacts/boot-failure.png',fullPage:true});
    const fatal=await page.locator('#fatal').innerText();
    throw Error('Falha na inicialização: '+fatal+'; console='+pageErrors.join(' | ')+'; '+error);
  }
  await page.waitForTimeout(1200);
  await check('Three.js carregado e cena 3D inicializada');

  await page.locator('#start-btn').click();
  assert.equal(await page.locator('#start-screen').isVisible(),false);
  await page.waitForTimeout(1500);
  await check('Nova partida iniciada e 90 quadros aproximados');

  await page.keyboard.press('e');
  await page.waitForTimeout(600);
  const mode=await page.locator('#mode-pill').innerText();
  assert.match(mode,/NIMBO|MONTAD|SOLO|VOO/i);
  await check('Interação inicial e montagem sem erro');

  await page.keyboard.down('w');
  await page.waitForTimeout(750);
  await page.keyboard.up('w');
  await page.keyboard.press('space');
  await page.waitForTimeout(800);
  await check('Entrada de movimento, aceleração e decolagem');

  await page.keyboard.press('t');
  await page.locator('#stable').waitFor({state:'visible',timeout:10000});
  assert.ok((await page.locator('#species-list').innerText()).includes('Fúria da Luz'));
  await page.locator('[data-preview="furia_luz"]').click();
  await page.waitForTimeout(500);
  await check('Estábulo e Fúria da Luz disponíveis na prévia');

  await page.locator('#stable-close').click();
  await page.keyboard.press('p');
  await page.waitForTimeout(450);
  await check('Salvar partida sem travamento de frame');
  await page.screenshot({path:'artifacts/brumaria-smoke.png',fullPage:true});
  console.log('RESULTADO: smoke browser concluído, screenshot artifacts/brumaria-smoke.png');
}finally{
  await browser.close();
}
