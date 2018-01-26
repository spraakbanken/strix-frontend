import { browser, by, element } from 'protractor';
import { StrixPage } from './app.po';

describe('strix App', function() {
  let page: StrixPage;

  beforeEach(() => {
    page = new StrixPage();
  });

  it('should show the relevant document', async () => {
    await browser.get('/?filters=W3siZmllbGQiOiJkYXRhdHlwIiwidmFsdWUiOiJodXZ1ZGRva3VtZW50In1d&documentID=25f95347-f194-4b1e-8737-9a4a41e86ae4&documentCorpus=rd-bet');  
    
    expect(element(by.css('.doc_header b')).getText()).toEqual('RD - Betänkande: Ny fastighetsmäklarlag (förnyad behandling)');
  });

  it('should filter when clicking a button in left sidebar', async () => {
    await browser.get('/');  

    let getNum = async () => {
        let text = (await element(by.css(".hits_header .num")).getText()).replace(/ /g, "")
        return Number(text)
    }
    let num = getNum()
    element(by.css(".aggregation_item")).click()
    expect(getNum()).toBeLessThan(await num)

  });
});
