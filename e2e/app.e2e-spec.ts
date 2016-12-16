import { StrixPage } from './app.po';

describe('strix App', function() {
  let page: StrixPage;

  beforeEach(() => {
    page = new StrixPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
