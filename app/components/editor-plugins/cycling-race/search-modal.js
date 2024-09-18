import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { action } from '@ember/object';
import { restartableTask, timeout } from 'ember-concurrency';
import { task as trackedTask } from 'ember-resources/util/ember-concurrency';
import { WorshipPluginConfig } from '@lblod/ember-rdfa-editor-lblod-plugins/plugins/worship-plugin';
import {
  fetchWorshipServices,
  SearchSort,
  WorshipService,
} from '@lblod/ember-rdfa-editor-lblod-plugins/plugins/worship-plugin/utils/fetchWorshipServices';
import { AdministrativeUnit } from '@lblod/ember-rdfa-editor-lblod-plugins/plugins/worship-plugin';
import { executeQuery } from '@lblod/ember-rdfa-editor-lblod-plugins/utils/sparql-helpers';

export default class CyclingRaceSearchModalComponent extends Component {
  // Filtering
  @tracked sort = false;
  @tracked inputSearchText = null;
  // We're deliberately using the arg to set the initial value
  // eslint-disable-next-line ember/no-tracked-properties-from-args

  // Display
  @tracked error;

  // Pagination
  @tracked pageNumber = 0;
  @tracked pageSize = 20;
  @tracked totalCount = 0;

  get config() {
    return this.args.config;
  }

  get searchText() {
    return this.inputSearchText;
  }

  @action
  setInputSearchText(event) {
    assert(
      'inputSearchText must be bound to an input element',
      event.target instanceof HTMLInputElement,
    );

    this.inputSearchText = event.target.value;
  }
  @action
  async closeModal() {
    await this.servicesResource.cancel();
    this.args.closeModal();
  }

  search = restartableTask(async () => {
    await timeout(500);

    const abortController = new AbortController();

    try {
      const queryResult = await fetchCyclingRaces({
        administrativeUnitURI: this.administrativeUnit?.uri,
        config: this.args.config,
        searchMeta: {
          abortSignal: abortController.signal,
          filter: {
            label: this.inputSearchText ?? undefined,
          },
          sort: this.sort,
          page: this.pageNumber,
          pageSize: this.pageSize,
        },
      });
      this.error = undefined;

      // Reset to first page if there are no results for this one e.g. when changing search
      if (
        this.pageNumber !== 0 &&
        this.pageNumber * this.pageSize >= queryResult.totalCount
      ) {
        this.pageNumber = 0;
      }

      return queryResult;
    } catch (error) {
      this.error = error;
      return {
        results: [],
        totalCount: 0,
      };
    } finally {
      abortController.abort();
    }
  });

  servicesResource = trackedTask(this, this.search, () => [
    this.inputSearchText,
    this.administrativeUnit,
    this.pageNumber,
    this.pageSize,
    this.sort,
  ]);

  @action
  setSort(sort) {
    this.sort = sort;
  }

  @action
  previousPage() {
    --this.pageNumber;
  }

  @action
  nextPage() {
    ++this.pageNumber;
  }
}

const query = `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX omgeving: <https://data.vlaanderen.be/ns/omgeving#>
  PREFIX time: <http://www.w3.org/2006/time#>
  PREFIX geosparql: <http://www.opengis.net/ont/geosparql#>
  PREFIX locn: <http://www.w3.org/ns/locn#>
  select distinct ?name ?requestUri ?organizerUri ?organizerName ?dateStart ?dateEnd ?activityUri where {
    ?zaak a dossier:Zaak ;
          dct:title ?name .
    ?dossier a dossier:Dossier ;
          dossier:Dossier.isNeerslagVan ?zaak ;
          omgeving:zaakhandeling ?requestUri .
    ?requestUri omgeving:inhoud ?recht .
    ?recht omgeving:voorwerp ?activityUri .
    ?activityUri omgeving:betrokkene ?organizerUri ;
    omgeving:Activiteit.tijdsbestek ?tijdsbestek .
    ?organizerUri skos:prefLabel ?organizerName.
    ?tijdsbestek a time:Interval ;
            time:hasBeginning ?dateStart ;
            time:hasEnd ?dateEnd.
  }

`;

async function fetchCyclingRaces() {
  const data = await executeQuery({
    query,
    endpoint: 'https://cycling-org.hackathon-7.s.redhost.be/sparql',
  });
  const cyclingRaces = data.results.bindings.map(createCyclingRace);
  //TODO create pagination
  return {
    results: cyclingRaces,
    totalCount: cyclingRaces.length,
  };
}

function createCyclingRace(bindings) {
  return {
    name: bindings.name.value,
    organizerName: bindings.organizerName.value,
    organizerUri: bindings.organizerUri.value,
    requestUri: bindings.requestUri.value,
    dateStart: new Date(bindings.dateStart.value),
    dateEnd: new Date(bindings.dateEnd.value),
    daysTillDeadline: getDiffDays(
      new Date(bindings.dateStart.value),
      new Date(),
    ),
    activityUri: bindings.activityUri.value,
  };
}

function getDiffDays(date1, date2) {
  const diffTime = date2 - date1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 0;
  return diffDays;
}
