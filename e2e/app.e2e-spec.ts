import { browser, by, element, Key } from 'protractor';

describe('strix App', function() {

  it('should show the relevant document', () => {
    browser.get('/?filters=W3siZmllbGQiOiJkYXRhdHlwIiwidmFsdWUiOiJodXZ1ZGRva3VtZW50In1d&documentID=25f95347-f194-4b1e-8737-9a4a41e86ae4&documentCorpus=rd-bet');

    expect(element(by.css('.doc_header b')).getText()).toEqual('RD - Betänkande: Ny fastighetsmäklarlag (förnyad behandling)');
  });

  it('should filter when clicking a button in left sidebar', async () => {
    await browser.get('/');

    const getNum = async () => element(by.css(".hits_header .num")).getText().then(text => Number(text.replace(' ', '')));
    const num = await getNum();

    element(by.css(".aggregation_item")).click()
    expect(getNum()).toBeLessThan(num);
  });

  describe('Search', () => {
    beforeEach(() => {
      browser.get('/');
    });

    it('is in phrase mode by default', () => {
      expect(element(by.model('isPhraseSearch')).getAttribute('checked')).toBeTruthy();
    });

    it('by "impossible" phrase', () => {
      element(by.model('asyncSelected')).sendKeys('talman fru tack', Key.ENTER);
      expect(element(by.css('no_hits_area')).isPresent()).toBe(true);
      expect(element(by.css('hits_area')).isPresent()).toBe(false);
    });

    it('by phrase', () => {
      element(by.model('asyncSelected')).sendKeys('tack fru talman', Key.ENTER);
      expect(element(by.css('no_hits_area')).isPresent()).toBe(false);
      element(by.css('.hit_document_title')).click();
      expect(element(by.css('.CodeMirror-code')).getText()).toMatch(/tack fru talman/i);
    });

    it('by keywords', () => {
      element(by.model('isPhraseSearch')).click();
      element(by.model('asyncSelected')).sendKeys('talman fru tack', Key.ENTER);
      expect(element(by.css('no_hits_area')).isPresent()).toBe(false);
      element(by.css('.hit_document_title')).click();
      expect(element(by.css('.CodeMirror-code')).getText()).toMatch(/tack fru talman/i);
    });
  });
});
