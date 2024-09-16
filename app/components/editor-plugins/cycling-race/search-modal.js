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

const MockData = [
  {
    name: 'The big cycling race',
    requestUri: 'http://data.lblod.info/aanvragen/1',
    organizerUri: 'http://data.lblod.info/organisaties/1',
    organizerName: 'Lily Lefèvre',
    organizerAddress: 'Edingensesteenweg 28, 1500, Halle',
    locations: [
      {
        uri: 'http://data.lblod.info/zones/1',
        name: 'het Citadelpark',
        geometry:
          'POLYGON((3.7168937735259537 51.03662243938447,3.718567304313183 51.037647059502746,3.7197848595678806 51.03666133741382,3.7188588269054894 51.035874515640955,3.7168937735259537 51.03662243938447))',
      },
      {
        uri: 'http://data.lblod.info/zones/2',
        name: 'omgeving in Gent',
        geometry:
          'LINESTRING(3.7244438210622612 51.03874007628664,3.7204485534162512 51.034672704529555,3.719244678836533 51.029355633627205,3.7121200278422886 51.026144539610016,3.7091498567154004 51.021152279963815)',
      },
    ],
    activityDate: '20/11/2024',
    activityStart: '18/11/2024',
    activityEnd: '22/11/2024',
    daysTillDeadline: 20,
  },
  {
    name: 'Race against ALS',
    requestUri: 'http://data.lblod.info/aanvragen/2',
    organizerUri: 'http://data.lblod.info/organisaties/2',
    organizerName: 'Lily Lefèvre',
    organizerAddress: 'Brusselstraat 64, 1702, Groot Bijgaarden',
    locations: [
      {
        uri: 'http://data.lblod.info/zones/1',
        name: 'het Citadelpark',
        geometry:
          'POLYGON((3.7168937735259537 51.03662243938447,3.718567304313183 51.037647059502746,3.7197848595678806 51.03666133741382,3.7188588269054894 51.035874515640955,3.7168937735259537 51.03662243938447))',
      },
      {
        uri: 'http://data.lblod.info/zones/2',
        name: 'omgeving in Gent',
        geometry:
          'LINESTRING(3.7244438210622612 51.03874007628664,3.7204485534162512 51.034672704529555,3.719244678836533 51.029355633627205,3.7121200278422886 51.026144539610016,3.7091498567154004 51.021152279963815)',
      },
    ],
    activityDate: '15/12/2024',
    activityStart: '13/12/2024',
    activityEnd: '17/12/2024',
    daysTillDeadline: 50,
  },
];

export default class WorshipPluginSearchModalComponent extends Component {
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

function fetchCyclingRaces() {
  return {
    results: MockData,
    totalCount: 3,
  };
}
