import Component from '@ember/component';
import EditTasklistSolution from '@lblod/ember-vo-tasklist/components/tasklist-solution/edit';
export default EditTasklistSolution.extend({
  classNameBindings: ['open:js-accordion--open'],
  open: false,
  click(){
    this.toggleProperty('open');
  }
});
