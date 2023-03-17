import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { action } from '@ember/object';

export default class SignedResource extends Component {
  @tracked showDeleteSignatureCard = false;

  @action
  toggleDeleteSignatureCard() {
    this.showDeleteSignatureCard = !this.showDeleteSignatureCard;
  }

  @action
  async deleteSignature() {
    const signature = this.args.signature;
    signature.deleted = true;
    //Check if versioned resource should be deleted
    let versionedResource;
    if (signature.agenda) {
      versionedResource = await signature.agenda;
    } else if (signature.versionedBesluitenLijst) {
      versionedResource = await signature.versionedBesluitenLijst;
    } else if (signature.versionedNotulen) {
      versionedResource = await signature.versionedNotulen;
    }
    if (versionedResource.get('publishedResource').get('id')) {
      await signature.save();
      return;
    }
    const signedResources = versionedResource.get('signedResources');
    const validSignedResources = signedResources.filter(
      (signature) => !signature.deleted
    );
    if (validSignedResources.length === 0) {
      versionedResource.deleted = true;
    }
    await versionedResource.save();
    await signature.save();
  }
}
