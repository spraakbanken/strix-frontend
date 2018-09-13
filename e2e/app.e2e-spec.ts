import { $, $$, browser, by, element, Key } from 'protractor';

describe('Strix', function() {

  describe('Filters', () => {

    async function getHits() {
      let t = await $(".hits_header .num").getText();
      return Number(t.replace(/[^0-9]/g, ''));
    }

    it('should filter when clicking a button in left sidebar', async () => {
      await browser.get('/');

      // Add filter condition.
      let hitsBefore = await getHits();
      let urlBefore = browser.getCurrentUrl();
      await $$(".aggregation_item").first().click();
      expect(await getHits()).toBeLessThan(hitsBefore);
      expect(await browser.getCurrentUrl()).not.toBe(urlBefore);

      // Add another condition for same filter.
      hitsBefore = await getHits();
      urlBefore = browser.getCurrentUrl();
      await $$(".aggregation_item").get(1).click();
      expect(await getHits()).toBeGreaterThan(hitsBefore);
      expect(await browser.getCurrentUrl()).not.toBe(urlBefore);

      // Remove a condition.
      hitsBefore = await getHits();
      await $$(".aggregation_item").get(1).click();
      expect(await getHits()).toBeLessThan(hitsBefore);
      expect(await browser.getCurrentUrl()).toBe(urlBefore);
    });

    it('should be activated from URL', async () => {
      // Collection: Wikipedia. Blingbring: musiker.
      await browser.get('/?filters=W3siZmllbGQiOiJibGluZ2JyaW5nIiwidmFsdWUiOiJtdXNpa2VyIn0seyJmaWVsZCI6ImNvcnB1c19pZCIsInZhbHVlIjoid2lraXBlZGlhIn1d');
      const selectedFilters = $$('.filter_btn');
      expect(await selectedFilters.count()).toBe(2);
      expect(await selectedFilters.get(0).$('.label').getText()).toMatch('Wikipedia');
      expect(await selectedFilters.get(1).$('.label').getText()).toMatch('musiker');
    })

    it('can be added from list', async () => {
      await browser.get('/');
      const newFacet = await $$('.unused_facets .aggregation_item').first();
      const newFacetName = await newFacet.getText();
      await newFacet.click();
      expect(await $$('.aggregation_list h4').last().getText()).toMatch(newFacetName);
      expect(await $$('.aggregation_list').last().$$('.aggregation_item').count()).toBeGreaterThan(0);
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
      expect(await browser.getCurrentUrl()).toMatch('query=sociala');
      await expect(element(by.css('.no_hits_area')).isPresent()).toBe(true);
      await expect(element(by.css('.hits_area')).isPresent()).toBe(false);
    });

    it('by phrase', async () => {
      await element(by.css('.search_widget [type=text]')).sendKeys('den sociala utvecklingen i vårt land', Key.ENTER);
      expect(await browser.getCurrentUrl()).toMatch(/query=den.*sociala/);
      await expect(element(by.css('no_hits_area')).isPresent()).toBe(false);

      await element.all(by.css('.hit_document_title')).first().click();
      await expect(element(by.css('.CodeMirror-code')).getText()).toMatch('den sociala utvecklingen i vårt land');
    });

    it('by keywords', async () => {
      await element(by.css('.search_widget [type=text]')).click();
      expect(await browser.getCurrentUrl()).toMatch('keyword_search=true');

      await element(by.css('.search_widget [type=text]')).sendKeys('den sociala utvecklingen i vårt land', Key.ENTER);
      expect(await browser.getCurrentUrl()).toMatch(/query=den.*sociala/);
      await expect(element(by.css('no_hits_area')).isPresent()).toBe(false);

      await element.all(by.css('.hit_document_title')).first().click();
      await expect(element(by.css('.CodeMirror-code')).getText()).toMatch('den sociala utvecklingen i vårt land');
    });

    it('by URL', async () => {
      await browser.get('/?query=svamp');
      expect(await $('.search_widget [type=text]').getAttribute('value')).toBe('svamp');
      await $$('.hit_area').map(async el => {
        expect(await el.getText()).toMatch('svamp')
      });
    });
  });

  describe('Document selection', () => {

    it('is paginated', async () => {
      await browser.get('/');
      expect(await $('.pagination-page.active').getText()).toBe('1');

      // Go to second page.
      await $$('.pagination-page').get(1).click();
      expect(await $('.pagination-page.active').getText()).toBe('2');
      expect(await browser.getCurrentUrl()).toMatch('page=2');

      // Go back to first.
      await $$('.pagination-page').get(0).click();
      expect(await browser.getCurrentUrl()).not.toMatch('page=');

      // Browse by prev/next.
      expect(await $('.pagination-prev').getAttribute('class')).toMatch(/\bdisabled\b/);
      await $('.pagination-next').click();
      expect(await $('.pagination-page.active').getText()).toBe('2');
      await $('.pagination-prev').click();
      expect(await $('.pagination-page.active').getText()).toBe('1');

      // Go from URL.
      await browser.get('/?page=3');
      expect(await $('.pagination-page.active').getText()).toBe('3');
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
