import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { action } from '@ember/object';

export default class DeadlinePill extends Component {
  get skin() {
    if (this.args.daysTillDeadline >= 100) {
      return 'success';
    } else if (this.args.daysTillDeadline >= 30) {
      return 'warning';
    } else {
      return 'error';
    }
  }
}
