import { browser, by, element } from 'protractor';

describe('strix App', function() {

  it('should show the relevant document', async () => {
    await browser.get('/?filters=W3siZmllbGQiOiJkYXRhdHlwIiwidmFsdWUiOiJodXZ1ZGRva3VtZW50In1d&documentID=25f95347-f194-4b1e-8737-9a4a41e86ae4&documentCorpus=rd-bet');  

    expect(element(by.css('.doc_header b')).getText()).toEqual('RD - Betänkande: Ny fastighetsmäklarlag (förnyad behandling)');
  });

  it('should filter when clicking a button in left sidebar', async () => {
    await browser.get('/');

    let getNum = async () => {
        let text = await element(by.css(".hits_header .num")).getText();
        return Number(text.replace(' ', ''));
    }
    let num = await getNum();
    await element(by.css(".aggregation_item")).click()
    expect(getNum()).toBeLessThan(num);

  });
});
