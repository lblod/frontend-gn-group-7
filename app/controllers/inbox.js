import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import ENV from 'frontend-gelinkt-notuleren/config/environment';

export default class InboxController extends Controller {
  @service currentSession;

  manualBaseUrl = ENV.manual.baseUrl;
}
