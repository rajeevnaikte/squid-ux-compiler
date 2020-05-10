module.exports = {
  name: 'form-field-valid',
  style() {
    const el0 = document.createTextNode('.form-group.' + this.getAttribute('id') + '{     margin: 10px;   }#ux123.' + this.getAttribute('id') + '{     padding: 10px;   }#ux123.' + this.getAttribute('id') + ' .some-class.' + this.getAttribute('id') + '{     color: red;   }.some-class.some-class2.' + this.getAttribute('id') + ', .some-class.some-class3.' + this.getAttribute('id') + ', .some-class.some-class4.' + this.getAttribute('id') + '{     border: 1px solid red;   }');
    const el1 = document.createElement('style');
    el1.setAttribute('class', this.getAttribute('id'));
    el1.appendChild(el0);
    return [el1];
  },
  html() {
    this.onDataUpdate = {};
    this.onDataUpdate['exampleInputEmail1'] = [];
    const el3 = document.createTextNode(i18n.translate('i18n:Email address'));
    const el4 = document.createElement('label');
    el4.setAttribute('for', this.getAttribute('exampleInputEmail1'));
    this.onDataUpdate['exampleInputEmail1'].push(() => el4.setAttribute('for', this.getAttribute('exampleInputEmail1')));
    el4.setAttribute('class', this.getAttribute('id'));
    el4.appendChild(el3);
    const el5 = document.createTextNode('test');
    const el6 = document.createElement('input');
    el6.setAttribute('type', 'email');
    el6.setAttribute('class', 'form-control ' + this.getAttribute('id'));
    el6.setAttribute('id', this.getAttribute('exampleInputEmail1'));
    this.onDataUpdate['exampleInputEmail1'].push(() => el6.setAttribute('id', this.getAttribute('exampleInputEmail1')));
    el6.setAttribute('aria-describedby', 'emailHelp');
    el6.setAttribute('placeholder', i18n.translate('i18n:Enter email'));
    const el7 = document.createTextNode('test2');
    const el8 = document.createElement('br');
    el8.setAttribute('class', this.getAttribute('id'));
    const el10 = document.createTextNode(i18n.translate('i18n:We\'ll never share your email with anyone else.'));
    const el11 = document.createElement('small');
    el11.setAttribute('id', 'emailHelp');
    el11.setAttribute('class', 'form-text text-muted ' + this.getAttribute('id'));
    el11.appendChild(el10);
    const el13 = document.createElement('div');
    el13.setAttribute('class', 'form-group ' + this.getAttribute('id'));
    el13.appendChild(el4);
    el13.appendChild(el5);
    el13.appendChild(el6);
    el13.appendChild(el7);
    el13.appendChild(el8);
    el13.appendChild(el11);
    return [el13];
  },
  script() {
    this.onresize = () => {
      console.log('hello');
    };
  }
};