import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

import { findAncestors } from '@lblod/ember-rdfa-editor/utils/position-utils';
import { hasOutgoingNamedNodeTriple } from '@lblod/ember-rdfa-editor-lblod-plugins/utils/namespace';
import {
  BESLUIT,
  RDF,
} from '@lblod/ember-rdfa-editor-lblod-plugins/utils/constants';
import { insertHtml } from '@lblod/ember-rdfa-editor/commands/insert-html-command';
import { executeQuery } from '@lblod/ember-rdfa-editor-lblod-plugins/utils/sparql-helpers';
export default class CyclingRaceSidebarInsertComponent extends Component {
  @tracked showModal = false;

  get controller() {
    return this.args.controller;
  }

  @action
  openModal() {
    this.controller.focus();
    this.showModal = true;
  }

  @action
  closeModal() {
    this.showModal = false;
  }

  @action
  async insertCyclingRaceDecision(cyclingRaceData) {
    this.modalEnabled = false;
    const { schema } = this.controller;
    cyclingRaceData.locations = await fetchLocations(
      cyclingRaceData.activityUri,
    );
    const html = generateHtml(cyclingRaceData);
    this.controller.doCommand(insertHtml(html, 0, 0, undefined, false, true), {
      view: this.controller.mainEditorView,
    });
    this.closeModal();
  }
}

function generateHtml({
  requestUri,
  organizerUri,
  organizerName,
  organizerAddress,
  locations,
  activityDate,
  activityStart,
  activityEnd,
  zones,
}) {
  return `<div property="prov:generated" resource="http://data.lblod.info/id/besluiten/\${generateUuid()}"
  typeof="besluit:Besluit ext:BesluitNieuweStijl https://data.vlaanderen.be/id/concept/BesluitType/e96ec8af-6480-4b32-876a-fefe5f0a3793">
  <p>Openbare titel besluit:</p>
  <h4 class="h4" property="eli:title" datatype="xsd:string"><span class="mark-highlight-manual">Geef titel besluit
      op</span></h4>
  <span style="display: none;" property="eli:language"
    resource="http://publications.europa.eu/resource/authority/language/NLD" typeof="skos:Concept">&nbsp;</span> <br />
  <p>Korte openbare beschrijving:</p>
  <p property="eli:description" datatype="xsd:string"><span class="mark-highlight-manual">Geef korte beschrijving
      op</span></p>
  <br />
  <div property="besluit:motivering" lang="nl">
    <p><span class="mark-highlight-manual">geef bestuursorgaan op</span>,</p>
    <br />
    <h5>Bevoegdheid</h5>
    <ul class="bullet-list">
      <li><span class="mark-highlight-manual">Rechtsgrond die bepaalt dat dit orgaan bevoegd is.</span></li>
    </ul>
    <br />
    <h5>Juridische context</h5>
    <ul class="bullet-list">
      <li><span class="mark-highlight-manual">Voeg juridische context in</span></li>
    </ul>
    <br />
    <h5>Feitelijke context en argumentatie</h5>
    <ul class="bullet-list">
      <li><span class="mark-highlight-manual">Voeg context en argumentatie in</span></li>
    </ul>
  </div>
  <br />
  <br />
  <h5>Beslissing</h5>
  <div property="prov:value" datatype="xsd:string">
    <div property="eli:has_part" resource="http://data.lblod.info/artikels/\${generateUuid()}" typeof="besluit:Artikel">
      <div>Artikel <span property="eli:number" datatype="xsd:string">1</span></div>
      <span style="display: none;" property="eli:language"
        resource="http://publications.europa.eu/resource/authority/language/NLD" typeof="skos:Concept">&nbsp;</span>
      <div property="prov:value" datatype="xsd:string">
        <span>
            <div rev="eli:realizes" resource="http://data.lblod.info/recht/\${generateUuid()}" typeof="https://data.vlaanderen.be/ns/omgevingsvergunning#Recht">
                <span rev="https://data.vlaanderen.be/ns/omgevingsvergunning#inhoud" resource="${requestUri}" typeof="https://data.vlaanderen.be/ns/omgevingsvergunning#Aanvraag"></span>
                <div property="https://data.vlaanderen.be/ns/omgevingsvergunning#voorwerp" resource="http://data.lblod.info/innames/test-uuid"
                typeof="https://data.vlaanderen.be/ns/omgevingsvergunning#Activiteit">

                    Aan <span property="https://data.vlaanderen.be/ns/omgevingsvergunning#betrokkene"
                    resource="${organizerUri}">${organizerName}</span>, ${organizerAddress}, het gebruik van
                    ${generateLocations(locations)} toe te staan op <span
                    property="https://data.vlaanderen.be/ns/omgevingsvergunning#Activiteit.tijdsbestek"
                    typeof="time:Interval">${activityDate} - met start opbouw op <span property="time:hasBeginning"
                        typeof="time:Instant"><span property="time:inXSDDateTime">${activityStart}</span></span> en einde afbouw op
                    <span property="time:hasEnd" typeof="time:Instant"><span property="time:inXSDDateTime">${activityEnd}</span>
                    </span> - zoals opgenomen in bijgevoegd plan en mits naleving van de voorwaarden geformuleerd in het bij
                    dit besluit gevoegde document.
                    </span>
                    ${generateZones(locations)}
            </div>
        </span>
      </div>

    </div>
  </div>
</div>`;
}

function generateLocations(locations) {
  return locations
    .map(
      (
        location,
      ) => `<span property="https://data.vlaanderen.be/ns/omgevingsvergunning#locatie"
  resource="${location.uri}"><span property="rdfs:label">${location.name}</span></span>`,
    )
    .join(' en ');
}

function generateZones(zones) {
  return zones
    .map(
      (zone) => `<div resource="${zone.uri}" typeof="geosparql:Feature">
      <span property="geosparql:hasGeometry"
          content="${zone.geometry}"
          datatype="geosparql:asWKT"></span>
      </div>`,
    )
    .join(' ');
}

async function fetchLocations(activityUri) {
  const query = `
    PREFIX omgeving: <https://data.vlaanderen.be/ns/omgeving#>
    PREFIX geosparql: <http://www.opengis.net/ont/geosparql#>
    PREFIX locn: <http://www.w3.org/ns/locn#>
    select distinct ?location ?name ?geometry where {
      <${activityUri}> omgeving:locatie ?location.
      ?location a geosparql:Feature;
              skos:prefLabel ?name;
              locn:geometry ?geometry.
    }
  `;
  const data = await executeQuery({
    query,
    endpoint: 'http://localhost:90/sparql',
  });
  console.log();
  const locations = data.results.bindings.map(createLocation);
  return locations;
}

function createLocation(bindings) {
  return {
    uri: bindings.location.value,
    name: bindings.name.value,
    geometry: bindings.geometry.value,
  };
}
