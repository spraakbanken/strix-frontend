import { browser, by, element, Key } from 'protractor';

describe('Strix', function() {

  describe('Filters', () => {

    it('should filter when clicking a button in left sidebar', async () => {
      async function getNum() {
        let t = await element(by.css(".hits_header .num")).getText();
        return Number(t.replace(/[^0-9]/g, ''));
      }

      await browser.get('/');
      const num = await getNum();
      await element.all(by.css(".aggregation_item")).first().click();
      expect(await getNum()).toBeLessThan(num);
    });
  });

  describe('Search', () => {

    beforeEach(async () => {
      await browser.get('/');
    });

    it('is in phrase mode by default', async () => {
      let checkbox = element(by.id('keyword_search'));
      await expect(checkbox.getAttribute('checked')).toBeTruthy();
    });

    it('by "impossible" phrase', async () => {
      await element(by.css('.search_widget [type=text]')).sendKeys('sociala den i utvecklingen land vårt', Key.ENTER);
      await expect(element(by.css('.no_hits_area')).isPresent()).toBe(true);
      await expect(element(by.css('.hits_area')).isPresent()).toBe(false);
    });

    it('by phrase', async () => {
      await element(by.css('.search_widget [type=text]')).sendKeys('den sociala utvecklingen i vårt land', Key.ENTER);
      await expect(element(by.css('no_hits_area')).isPresent()).toBe(false);
      await element.all(by.css('.hit_document_title')).first().click();
      await expect(element(by.css('.CodeMirror-code')).getText()).toMatch('den sociala utvecklingen i vårt land');
    });

    it('by keywords', async () => {
      await element(by.css('.search_widget [type=text]')).click();
      await element(by.css('.search_widget [type=text]')).sendKeys('den sociala utvecklingen i vårt land', Key.ENTER);
      await expect(element(by.css('no_hits_area')).isPresent()).toBe(false);
      await element.all(by.css('.hit_document_title')).first().click();
      await expect(element(by.css('.CodeMirror-code')).getText()).toMatch('den sociala utvecklingen i vårt land');
    });
  });

  describe('Document', () => {

    it('should open by URL', async () => {
      await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
      const title = await element(by.css('.doc_header b')).getText();
      // Corpus name not included in check, because browser locale is unknown.
      await expect(title).toMatch('Knölpåkar');
    });
  })
});
