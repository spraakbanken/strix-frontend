import { Component, VERSION, OnInit, Input, ViewChild, OnChanges, SimpleChanges } from "@angular/core";
import "ol/ol.css";
import Map from "ol/Map";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import { filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { Subscription, Observable } from 'rxjs';
import { fromLonLat, toLonLat} from "ol/proj";
import { Point } from "ol/geom";
import { Feature } from "ol";
import { Vector } from "ol/layer";
import { Vector as sv } from "ol/source";
import { Style, Fill, Circle, Text } from "ol/style";
import Overlay from "ol/Overlay";
import { toStringHDMS } from "ol/coordinate";
import { LocService } from "app/loc.service";
import { CallsService } from "app/calls.service";
import { MetadataService } from "app/metadata.service";
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { AppComponent } from 'app/app.component';

declare const $: any;

import { AppState, CHANGELANG, CHANGE_INCLUDE_FACET, MODE_SELECTED} from '../searchreducer';

@Component({
  selector: 'viewmap',
  templateUrl: 'viewmap.component.html',
  styleUrls: ['viewmap.component.css']
})
export class ViewMapComponent implements OnInit, OnChanges {

   @ViewChild(Map) map: Map;
   
    name = "Angular " + VERSION.major;
    // public map: any;
    public vectorLayer: any;
    public currentLocation: string;
    public selectedLanguage: string;
    public cityLoc: string;
    public dataFromFacet = [];
    public refObject = {};
    public currentC = [];
    public modeS = '';
    public searchString = "";
    public keywordSearch: boolean;
    public locationArray = [];
    public locationCorpora = {};
    public _temp = [];
    private availableCorpora : { [key: string] : StrixCorpusConfig};
    private metadataSubscription: Subscription;
    public inputText: string = "";
    public indexRef = 0;
    public previousMode: string;

    @Input() viewMap: string;
    
    private searchRedux: Observable<any>;
    constructor(private store: Store<AppState>, private locService: LocService, private callsService: CallsService,
      private metadataService: MetadataService, private appComponent: AppComponent) {
    this.searchRedux = this.store.select('searchRedux');
    // this.map = new Map;
    this.currentLocation = '';
    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGELANG)).subscribe((data) => {
      this.selectedLanguage = data.lang;
      // this.callsService.getInfoStrix().subscribe((infoStrix) => {
      //   this.getStrixInfo = infoStrix;
      // }); 
    });

    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = this.metadataService.getAvailableCorpora();
          // console.log("this.availableCorpora subsc", this.availableCorpora)
        }
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      this.previousMode = this.modeS[0];
      this.indexRef = 0;
  })

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGE_INCLUDE_FACET)).subscribe((data) => {
      this.locationArray = [];
      if (data.include_facets.length > 0 && data.selectedCorpora.length > 0) {
        this.selectedLanguage = data.lang;
        this.currentC = data.selectedCorpora;
        this.modeS = data.modeSelected;
        this.searchString = data.query;
        this.keywordSearch = data.keyword_search;
        this.dataFromFacet = [];
        this.callsService.getGeoStatistics(data.selectedCorpora, data.modeSelected, data.include_facets, data.query, data.keyword_search, data.filters).subscribe((result) => {
          let _1 = _.values(result.aggregations)
          let _2 = {};
          let _3 = [];
          for (let x = 0; x < _1.length; x++) {
            _2[_1[x]['key'].split(';')[0]] = [_1[x]['value'],_1[x]['key']]
            let count = 0
            for (let y of _1[x]['value']) {
              count = count + y.doc_count;
            }
            _3.push({'key': _1[x]['key'], 'doc_count': count})
          }
          this.locationCorpora = _2;
          this.dataFromFacet = _3 // result.geo_context.geo_location.buckets
          // this.locationArray = _.map(this.dataFromFacet, 'key')
          // this.callsService.getDataforFacet(this.currentC, [this.modeS], 'geo_location', this.locationArray, this.searchString, this.keywordSearch).subscribe((result) => {
          //   let _1 = _.values(result.aggregations)
          //   let _2 = {};
          //   for (let x = 0; x < _1.length; x++) {
          //     _2[_1[x]['key'].split(';')[0]] = [_1[x]['value'],_1[x]['key']]
          //   }
          //   this.locationCorpora = _2;
          // });
        });
      }
    });
    }

    public showLocationHits(event, event1) {
      let x = {};
      for (let item of this.locationCorpora[event][0]) {
        x[item['key']] = item['doc_count']
      }
      let doc = {'filterStat': [{'field': 'geo_location', 'value': event1}], 'current_corpora': this.currentC, 'query': '', 'keyword': this.keywordSearch, 'fromPage': 0, 'toPage': 5, 'sideBar': x};
      this.appComponent.listViewTabs.push('++'+event+ this.indexRef.toString()); // ('DocSim-' + docIndex);
      let tempOption = event + this.indexRef.toString();
      this.indexRef = this.indexRef + 1;
      this.appComponent.selectedViewTab.setValue(this.appComponent.listViewTabs.length - 1);
      this.appComponent.statParam[tempOption] = doc;
   }
    
    public showMap() {
      let me = this;
      let featuresN = [];
      this.refObject = {};
      for (let i = 0; i < this.dataFromFacet.length; i++) {
        let j = this.dataFromFacet[i].key.split(';')
        this.refObject[j[0]] = this.dataFromFacet[i].doc_count.toString()
        var tempFeature = new Feature({
          geometry: new Point(fromLonLat([j[3], j[2]])),
          name: j[0],
          circleColor: 'orange'
        });
        featuresN.push(tempFeature)
      }
      var vectorSource = new sv({
        features: featuresN
      });

      var vectorLayer = new Vector({
        source: vectorSource,
        style: function (feature, resolution) {
          return [new Style({
            image: new Circle({
              radius: 10,
              fill: new Fill({
                  color: feature.get('circleColor') // use style attribute for the fill color
              })
            }),
          })];
        }
      });
      vectorLayer.set('name', this.modeS[0])
      if (this.map === undefined) {
        this.currentLocation = '';
        this.map = new Map({
          layers: [
            new TileLayer({
              source: new OSM()
            })
          ],
          view: new View({
            center: fromLonLat([11.9667, 57.70716]), /* Coordinates */
            zoom: 4
          }),
        });

        this.map.addLayer(vectorLayer);
        const popup = new Overlay({
          element: document.getElementById("popup")
        });
        this.map.addOverlay(popup);

        this.map.on("pointermove", function(evt) {
          var feature = evt.map.forEachFeatureAtPixel(evt.pixel, function(feature) {
            return feature;
         });
          if (feature) {
            var _temp = me.locationCorpora[feature.get('name')][0]
            $('#locationcorpora').empty();
            $('#locationtext').empty();
            $('#locationdoc').empty();
            for (let item of _temp) {
              $('#locationcorpora').append('<span>'+me.availableCorpora[item.key]['name'][me.selectedLanguage]+': '+item.doc_count+'</span><br/>')
            }
            $('#locationtext').append('<span><i>'+me.locService.getTranslationFor('city')+': </i></span><span>'+feature.get('name')+'</span>')
            $('#locationdoc').append('<span><i>'+me.locService.getTranslationFor('numDoc')+': </i></span><span>'+me.refObject[feature.get('name')].toString()+'</span>')
          
          const element = popup.getElement();
          const coordinate = evt.coordinate;
          const hdms = toStringHDMS(toLonLat(coordinate));
  
          $(element).popover("dispose");
          popup.setPosition(coordinate);
          $(element).popover({
            placement: "top",
            animation: true,
            html: true,
            content: function() {
              return $('#customdiv').html();
            } 
            // content: "<p>The location you clicked was:</p><span class='btn btn-link float-right pop-close'>x</span><code>" + hdms + "</code>"
          });
          $(element).popover("show");
          $('.pop-close').click(function() {
            me.showLocationHits(feature.get('name'), me.locationCorpora[feature.get('name')][1])
            $(element).popover('hide');
        });
        
      } else {
        const element = popup.getElement();
        $(element).popover('hide');
      }
        });
      if (this.map) {
        this.map.setTarget("map"); 
      }
      } else {
        this.map.getLayers().getArray()
          .filter(layer => layer.get('name') === this.previousMode)
          .forEach(layer => this.map.removeLayer(layer));
        this.map.addLayer(vectorLayer);
      }
    }

    ngOnInit() {  
    }

    ngOnChanges(changes: SimpleChanges) {
      if (changes.viewMap.currentValue === 'Maps') {
        this.showMap();
      }
    }
  }
  
