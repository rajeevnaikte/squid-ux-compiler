module.exports = {
  name: 'table',
  style () {

  },
  html () {
    const el1 = document.createElement('items');
    el1.setAttribute('class', this.getData('id'));
    const el3 = document.createElement('table');
    el3.setAttribute('class', this.getData('id'));
    el3.appendChild(el1);
    return [el3];
  },
  script () {

  }
};