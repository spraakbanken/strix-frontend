import { browser, by, element, Key } from 'protractor';

describe('strix App', function() {

  it('should show the relevant document', async () => {
    await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
    const title = await element(by.css('.doc_header b')).getText();
    // Corpus name not included in check, because browser locale is unknown.
    await expect(title).toMatch('Knölpåkar');
  });

  it('should filter when clicking a button in left sidebar', async () => {
    await browser.get('/');

    async function getNum() {
      let t = await element(by.css(".hits_header .num")).getText();
      return Number(t.replace(/[^0-9]/g, ''));
    }

    const num = await getNum();

    await element.all(by.css(".aggregation_item")).first().click();
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
