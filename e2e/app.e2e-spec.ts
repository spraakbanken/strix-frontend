import { browser, by, element } from 'protractor';
import { StrixPage } from './app.po';

describe('strix App', function() {
  let page: StrixPage;

  beforeEach(() => {
    page = new StrixPage();
  });

  it('should show the relevant document', () => {
    browser.get('/?filters=W3siZmllbGQiOiJkYXRhdHlwIiwidmFsdWUiOiJodXZ1ZGRva3VtZW50In1d&documentID=25f95347-f194-4b1e-8737-9a4a41e86ae4&documentCorpus=rd-bet');  
    
    expect(element(by.css('.doc_header b')).getText()).toEqual('RD - Betänkande: Ny fastighetsmäklarlag (förnyad behandling)');
  });
});
