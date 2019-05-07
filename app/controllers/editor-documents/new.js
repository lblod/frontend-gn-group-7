import Controller from '@ember/controller';
import EditorDocumentBaseController from '../../mixins/editor-document-base-controller';
import { task } from 'ember-concurrency';
import ENV from 'frontend-gelinkt-notuleren/config/environment';

export default Controller.extend(EditorDocumentBaseController, {
  init() {
    this._super(...arguments);
    this.set('publicationUrl', ENV['publicatie']['baseUrl']);
  },

  saveAndTransitionToEditMode: task(function * (){
    let nearestNode = this.editor.currentNode.parentElement;
     let editorDocument = this.editorDocument;
     if(this.hasDocumentValidationErrors(editorDocument)){
       this.set('validationErrors', true);
       return;
     }
    let savedDoc = yield this.saveEditorDocument.perform(editorDocument, this.getStatusFor('conceptStatusId'));
    const container = yield savedDoc.get('documentContainer');
    this.transitionToRoute('editor-documents.edit', container.id);
  }),

  actions: {
    handleRdfaEditorInit(editor){
      if(editor){
         this.set('editor', editor);
         this.set('editorDomNode', editor.get('rootNode'));
         return;
       }
       this.set('editorDomNode', null);
    },
    save(){
      this.saveAndTransitionToEditMode.perform();
    }
  }
});
