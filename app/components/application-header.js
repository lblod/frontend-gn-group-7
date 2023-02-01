import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ApplicationHeaderComponent extends Component {
  @service currentSession;
  @service session;
  @action
  logout() {
    this.session.invalidate();
  }
}
