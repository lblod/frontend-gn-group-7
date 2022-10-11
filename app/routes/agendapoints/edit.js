import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class AgendapointsEditRoute extends Route {
  @service currentSession;
  @service router;

  beforeModel(transition) {
    if (!this.currentSession.canWrite) {
      const id = transition.to.params?.id;
      this.router.transitionTo('agendapoints.show', id);
      return;
    }
  }

  async model() {
    return this.modelFor('agendapoints');
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.uploading = false;
    controller._editorDocument = null;
  }
}
