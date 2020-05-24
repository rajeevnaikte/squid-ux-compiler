import { UI, ViewState } from 'squid-ui';

export const app: ViewState = {
  ux: 'panel.my-panel',
  name: '',
  items: [
    {
      ux: 'form.field.textinput'
    }
  ]
};

UI.render(app);
