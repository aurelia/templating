import {ContentSelector} from './content-selector';

export class ViewSlot {
  constructor(anchor, anchorIsContainer, executionContext){
    this.anchor = anchor;
    this.viewAddMethod = anchorIsContainer ? 'appendNodesTo' : 'insertNodesBefore';
    this.executionContext = executionContext;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;

    anchor.viewSlot = this;
  }

  bind(executionContext){
    if(this.isBound){
      if(this.executionContext === executionContext){
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.executionContext = executionContext = executionContext || this.executionContext;
    this.children.forEach(x => x.bind(executionContext, true));
  }

  unbind(){
    this.isBound = false;
    this.children.forEach(x => x.unbind());
  }

  add(view){
    view[this.viewAddMethod](this.anchor);
    this.children.push(view);

    if(this.isAttached){
      view.attached();
    }
  }

  insert(index, view){
    if((index === 0 && !this.children.length) || index >= this.children.length){
      this.add(view);
    } else{
      view.insertNodesBefore(this.children[index].firstChild);
      this.children.splice(index, 0, view);

      if(this.isAttached){
        view.attached();
      }
    }
  }

  remove(view){
    view.removeNodes();
    this.children.splice(this.children.indexOf(view), 1);

    if(this.isAttached){
      view.detached();
    }
  }

  removeAt(index){
    var view = this.children[index];

    view.removeNodes();
    this.children.splice(index, 1);

    if(this.isAttached){
      view.detached();
    }

    return view;
  }

  removeAll(){
    var children = this.children,
        ii = children.length,
        i;

    for(i = 0; i < ii; i++){
      children[i].removeNodes();
    }

    if(this.isAttached){
      for(i = 0; i < ii; i++){
        children[i].detached();
      }
    }

    this.children = [];
  }

  swap(view){
    this.removeAll();
    this.add(view);
  }

  attached(){
    if(this.isAttached){
      return;
    }

    this.isAttached = true;
    this.children.forEach(x => x.attached());
  }

  detached(){
    if(this.isAttached){
      this.isAttached = false;
      this.children.forEach(x => x.detached());
    }
  }

  installContentSelectors(contentSelectors){
    this.contentSelectors = contentSelectors;
    this.add = this.contentSelectorAdd;
    this.insert = this.contentSelectorInsert;
    this.remove = this.contentSelectorRemove;
    this.removeAt = this.contentSelectorRemoveAt;
    this.removeAll = this.contentSelectorRemoveAll;
  }

  contentSelectorAdd(view){
    ContentSelector.applySelectors(
      view, 
      this.contentSelectors,
      (contentSelector, group) => contentSelector.add(group)
      );

    this.children.push(view);

    if(this.isAttached){
      view.attached();
    }
  }

  contentSelectorInsert(index, view){
    if((index === 0 && !this.children.length) || index >= this.children.length){
      this.add(view);
    } else{
      ContentSelector.applySelectors(
        view, 
        this.contentSelectors,
        (contentSelector, group) => contentSelector.insert(index, group)
      );

      this.children.splice(index, 0, view);

      if(this.isAttached){
        view.attached();
      }
    }
  }

  contentSelectorRemove(view){
    var index = this.children.indexOf(view),
        contentSelectors = this.contentSelectors;
    
    for(var i = 0, ii = contentSelectors.length; i < ii; i++){
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if(this.isAttached){
      view.detached();
    }
  }

  contentSelectorRemoveAt(index){
    var view = this.children[index],
        contentSelectors = this.contentSelectors;

    for(var i = 0, ii = contentSelectors.length; i < ii; i++){
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if(this.isAttached){
      view.detached();
    }

    return view;
  }

  contentSelectorRemoveAll(){
    var children = this.children,
        contentSelectors = this.contentSelectors,
        ii = children.length,
        jj = contentSelectors.length,
        i, j, view;

    for(i = 0; i < ii; i++){
      view = children[i];

      for(j = 0; j < jj; j++){
        contentSelectors[j].removeAt(i, view.fragment);
      }
    }

    if(this.isAttached){
      for(i = 0; i < ii; i++){
        children[i].detached();
      }
    }

    this.children = [];
  }
}