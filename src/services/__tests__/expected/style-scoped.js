module.exports = {
  name: 'style-scoped',
  style () {
    const el0 = document.createTextNode('.form-group.' + this.getData('id') + '{         padding: 10px;     }.' + this.getData('id') + ' .form-group{         margin: 10px;     }');
    const el1 = document.createElement('style');
    el1.setAttribute('class', this.getData('id'));
    el1.appendChild(el0);
    return [el1];
  },
  html () {
    this.onDataUpdate['text'] = [];
    const el2 = document.createTextNode(this.getData('text'));
    this.onDataUpdate['text'].push(() => el2.nodeValue = this.getData('text'));
    const el3 = document.createElement('div');
    el3.setAttribute('class', this.getData('id'));
    el3.appendChild(el2);
    return [el3];
  },
  script () {

  }
};