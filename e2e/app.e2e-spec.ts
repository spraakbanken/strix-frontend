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
      expect(await selectedFilters.get(0).$('.label').getText()).toMatch('Svenska Wikipedia');
      expect(await selectedFilters.get(1).$('.label').getText()).toMatch('musiker');
    })

    it('can be added from list', async () => {
      await browser.get('/');
      const newFacet = await $$('.unused_facets .aggregation_item').first();
      const newFacetName = await newFacet.getText();
      await newFacet.click();
      // TODO: Added facet is not necessarily last.
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
      await $('.search_widget [type=text]').sendKeys('sociala den i utvecklingen land vårt', Key.ENTER);
      expect(await browser.getCurrentUrl()).toMatch('query=sociala');
      await expect($('.no_hits_area').isPresent()).toBe(true);
      await expect($('.hits_area').isPresent()).toBe(false);
    });

    // TODO: Fails sometimes.
    it('by phrase', async () => {
      await $('.search_widget [type=text]').sendKeys('den sociala utvecklingen i vårt land', Key.ENTER);
      expect(await browser.getCurrentUrl()).toMatch(/query=den.*sociala/);
      await expect($('no_hits_area').isPresent()).toBe(false);

      await $$('.hit_document_title').first().click();
      // The CodeMirror text is '1' sometimes. Does Protractor not know to wait for it to load? Maybe sleeping will help.
      await browser.sleep(1000);
      await expect($('.CodeMirror-code').getText()).toMatch('den sociala utvecklingen i vårt land');
    });

    // TODO: Fails sometimes.
    it('by keywords', async () => {
      await element(by.id('keyword_search')).click();
      expect(await browser.getCurrentUrl()).toMatch('keyword_search=true');

      await $('.search_widget [type=text]').sendKeys('den sociala utvecklingen i vårt land', Key.ENTER);
      expect(await browser.getCurrentUrl()).toMatch(/query=den.*sociala/);
      await expect($('no_hits_area').isPresent()).toBe(false);

      await expect($('.hits_area').getText()).toMatch('den sociala utvecklingen i vårt land');
    });

    // TODO: Fails sometimes.
    it('by URL', async () => {
      await browser.get('/?query=svamp');
      expect(await $('.search_widget [type=text]').getAttribute('value')).toBe('svamp');
      await $$('.hit_area').map(async el => {
        expect(await el.getText()).toMatch('svamp')
      });
    });
  });

  describe('Document selection', () => {

    // TODO: Fails sometimes.
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

    function findToken(n) {
      return $$('.CodeMirror-code .cm-even, .CodeMirror-code .cm-odd').get(n);
    }

    // TODO: Fails sometimes.
    it('can be opened and closed', async () => {
      await browser.get('/');

      // Open.
      const title = await $$('.hit_document_title').first().getText();
      await $$('.hit_document_title').first().click();
      expect((await $('.doc_header b').getText()).includes(await title)).toBe(true);

      // Close.
      await $('.doc_header .close_box').click();
      expect(await $('.doc_header b').isPresent()).toBe(false);
      expect(await $('docselection').isDisplayed()).toBe(true);
    });

    it('should open by URL', async () => {
      await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
      const title = await $('.doc_header b').getText();
      await expect(title).toMatch('Etnologiska frågelistor: Knölpåkar');
    });

    it('supports local search', async () => {
      await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
      await $('.search_area [type=text]').sendKeys('slå', Key.ENTER);

      // Highlight.
      // TODO: How to check for highlight?
      // await browser.sleep(1000);
      // expect(await $('.CodeMirror-line span[style*="background-color"]').getText()).toMatch(/^sl(år?|og)/);

      // Sidebar.
      await $('accordion-group .fa-search').click();
      await $$('.bookmark').first().click();
      const textBefore = await $('.CodeMirror-code').getText();
      await $$('.bookmark').get(1).click();
      await browser.sleep(1000);
      // expect(await $('.CodeMirror-line span[style*="background-color"]').getText()).toMatch(/^sl(år?|og)/);
      expect(await $('.CodeMirror-code').getText()).not.toEqual(textBefore);
    });

    it('sidebar is updated when token is clicked', async () => {
      await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
      const accordion = $('accordion').getWebElement();
      let sidebarBefore = await accordion.getText();

      await findToken(10).click();
      let sidebarAfter = await accordion.getText();
      await expect(sidebarBefore).not.toEqual(sidebarAfter);

      // TODO: Timeout while waiting for element with locator.
      await findToken(7).click();
      await expect(sidebarAfter).not.toEqual(await accordion.getText());
    });

    it('related', async () => {
      await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
      expect(await $('minidocselection').isDisplayed()).toBe(true);
      await $$('minidocselection .hit_box a').first().click();
      expect(await $('.doc_header b').getText()).not.toMatch('Knölpåkar');
    });

    describe('highlight', () => {

      // TODO: Fails randomly and often for unknown reasons.
      it('by dropdowns', async () => {
        await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
        expect(await $$('.annotation-dropdown').first().getText()).toMatch('ordattribut');
        await $$('.annotation-dropdown').get(1).click();
        await $$('.dropdown-item').filter(el => el.getText().then(t => /ordklass/.test(t))).first().click();
        await $('.annotation-typeahead').click();
        await $$('.dropdown-item annotation').get(1).click();
        expect(await $$('.cm-underlined').count()).toBeGreaterThan(0);

        const getAccordionText = () => $('.right_accordion').getWebElement().getText();
        let sidebarBefore = await getAccordionText();
        await $('annotations-selector .fa-arrow-right').click();
        await $('annotations-selector .fa-arrow-right').click();
        let sidebarAfter = await getAccordionText();
        await expect(sidebarBefore).not.toEqual(sidebarAfter);
        await $('annotations-selector .fa-arrow-left').click();
        await expect(sidebarAfter).not.toEqual(await getAccordionText());
      });

      // TODO: Fails randomly and often for unknown reasons.
      it('by sidebar', async () => {
        await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
        // "NORDISKA" is selected.
        await $$('.right_accordion accordion-group').get(2).click();
        await $$('annotation').filter(el => el.getText().then(t => /adjektiv/.test(t))).first().click();
        // TODO: Add expectations for highlight and prev/next links.
      });

      // TODO: Fails randomly and often for unknown reasons.
      it('sidebar is updated when a new token is clicked', async () => {
        await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
        let sidebarBefore = await $('.right_accordion').getWebElement().getText();
        await findToken(10).click();
        expect(await sidebarBefore).not.toEqual(await $('.right_accordion').getWebElement().getText());
      });
    });
  });

  describe('Other', () => {

    it('Change language', async () => {
      await browser.get('/');
      expect(await $('.language_choice a.disabled').getText()).toMatch('swe');
      expect(await $('.search_area .btn-primary').getText()).toMatch('Sök');
      expect(await $('.language_choice a:not(.disabled)').getText()).toMatch('eng');
      await $('.language_choice a:not(.disabled)').click();
      expect(await $('.search_area .btn-primary').getText()).toMatch('Search');
    });

    // TODO: Passes locally but not on Travis.
    it('Home link', async () => {
      await browser.get('/');
      const startUrl = await browser.getCurrentUrl();
      await browser.get('?documentID=20d:0&documentCorpus=fragelistor');
      await $('.logo_block img').click();
      expect(await browser.getCurrentUrl()).toBe(startUrl);
    });

    it('Collaborator links', async () => {
      await browser.get('/');
      expect(await $('a[href="https://spraakbanken.gu.se"]').isDisplayed()).toBe(true);
      expect(await $('a[href="https://sweclarin.se"]').isDisplayed()).toBe(true);
    });

    it('Login link present', async () => {
      await browser.get('/');
      expect(await $('.login a').getText()).toMatch('Logga in');
      browser.ignoreSynchronization = true;
      await $('.login a').click();
      expect(await $('body').getText()).toMatch('identify yourself');
      browser.ignoreSynchronization = false;
    });
  });
});
